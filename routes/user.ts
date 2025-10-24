import express from "express";
import { verifyJWT } from "../middleware/verify";
import { $ } from "../utils/catchAsync";
import { fetchSelf, fetchUser } from "../controllers/user";

const userRoutes = express.Router();

userRoutes.get("/", (req, res) => {
    res.json({ message: "Hello World" });
});

userRoutes.use(verifyJWT);

userRoutes.get("/me" , $(fetchSelf));
userRoutes.get("/:id" , $(fetchUser));

export default userRoutes;