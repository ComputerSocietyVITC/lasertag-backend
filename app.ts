import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import userRoutes from "./routes/user";
import authRoutes from "./routes/auth";
import teamRoutes from "./routes/teams";
import adminRoutes from "./routes/admin";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "OK" , timestamp : new Date().toISOString()});
});

app.use("/api/auth" , authRoutes);
app.use("/api/teams" , teamRoutes);
app.use("/api/users" , userRoutes);
app.use("/api/admin" , adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;