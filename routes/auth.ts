import express from "express";
import { $ } from "../utils/catchAsync";
import { Login } from "../controllers/auth";

const authRoutes = express.Router();

authRoutes.post("/login", $(Login));

export default authRoutes;