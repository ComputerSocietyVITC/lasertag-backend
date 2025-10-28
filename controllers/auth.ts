import type {NextFunction, Request, Response} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {getUserByEmail} from "../models/user";
import {AppError} from "../types/error";

export const Login = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) {
      throw new AppError("Request body is required", 400);
    }
    
    const {email, password} = req.body;

    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    const user = await getUserByEmail(email);
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        is_leader: user.is_leader,
      },
      process.env.SECRET_KEY as string,
      {expiresIn: "12h"}
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        team_id: user.team_id,
        is_leader: user.is_leader,
        created_at: user.created_at,
      },
    });
};