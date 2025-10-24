import type { NextFunction, Response } from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";
import { AppError } from "../types/error";
import type { AuthorizedRequest } from "../types";
import { $ } from "../utils/catchAsync";

dotenv.config();

export const verifyJWT = $(async (req : AuthorizedRequest, res : Response, next : NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        throw new AppError('No token provided', 401);
    }

    const secretKey = process.env.SECRET_KEY;

    if(!secretKey) {
        logger.error("SECRET_KEY is not defined in environment variables");
        throw new AppError('Internal server error', 500);
    }

    jwt.verify(token, secretKey, (err, decoded : any) => {
        if (err) {
            return next(new AppError('Failed to authenticate token', 401));
        }
        req.userId = decoded.id;
        next();
    });
});