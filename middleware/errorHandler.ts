import type { Request, Response, NextFunction } from "express";
import { AppError } from "../types/error";
import logger from "../utils/logger";

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = 500;
    let message = "Internal Server Error";
    let isOperational = false;

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        isOperational = err.isOperational;
    }

    if (statusCode >= 500) {
        logger.error({
            message: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
        });
    } else {
        logger.warn({
            message: err.message,
            url: req.url,
            method: req.method,
        });
    }

    res.status(statusCode).json({
        status: "error",
        statusCode,
        message,
        ...(process.env.NODE_ENV === "development" && {
            stack: err.stack,
        }),
    });
};

export const notFoundHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404);
    next(error);
};
