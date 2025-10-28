import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getAdminByUsername } from "../models/admin";
import { AppError } from "../types/error";
import type { AuthorizedRequest } from "../types";

export const adminLogin = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) {
        throw new AppError("Request body is required", 400);
    }

    const { username, password } = req.body;

    if (!username || !password) {
        throw new AppError("Username and password are required", 400);
    }

    const admin = await getAdminByUsername(username);
    if (!admin) {
        throw new AppError("Invalid username or password", 401);
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash!);
    if (!isMatch) {
        throw new AppError("Invalid username or password", 401);
    }

    const token = jwt.sign(
        {
            id: admin.id,
            username: admin.username,
            email: admin.email,
            isAdmin: true,
        },
        process.env.SECRET_KEY as string,
        { expiresIn: "12h" }
    );

    res.status(200).json({
        success: true,
        message: "Admin login successful",
        token,
        admin: {
            id: admin.id,
            username: admin.username,
            email: admin.email,
            created_at: admin.created_at,
        },
    });
};
