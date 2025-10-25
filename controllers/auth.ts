import type {NextFunction, Request, Response} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";
import {getUserByEmail} from "../models/user";
import {AppError} from "../types/error";

export const Login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {email, password} = req.body;

    if (!email || !password) {
      return res.status(400).json({success: false, message: "Email and password are required"});
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({success: false, message: "Invalid email or password"});
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({success: false, message: "Invalid email or password"});
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        is_leader: user.is_leader,
      },
      process.env.SECRET_KEY as string,
      {expiresIn: "1h"}
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

  } catch (error) {
    logger.error("Login error:", error);
    next(new AppError("Internal Server Error", 500));
  }
};