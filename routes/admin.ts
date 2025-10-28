import { Router } from "express";
import { adminLogin } from "../controllers/admin";
import { $ } from "../utils/catchAsync";

const router = Router();

router.post("/login", $(adminLogin));

export default router;
