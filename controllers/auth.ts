import type { NextFunction, Request, Response } from "express";

export const Login = async (req : Request, res : Response, next : NextFunction) => {
    // TODO: Implement login logic
    res.json({ message: "Login route" });
};