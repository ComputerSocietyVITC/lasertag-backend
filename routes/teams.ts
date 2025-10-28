import express from "express";
import { verifyJWT } from "../middleware/verify";
import { exitTeam, joinTeam, makePublic, makeTeam } from "../controllers/team";
import { $ } from "../utils/catchAsync";

const teamRoutes = express.Router();

teamRoutes.use(verifyJWT);

teamRoutes.post("/create" , $(makeTeam));
teamRoutes.post("/join" , $(joinTeam));
teamRoutes.delete("/leave" , $(exitTeam));
teamRoutes.patch("/makePublic" , $(makePublic));
teamRoutes.patch("/exit" , $(exitTeam));

export default teamRoutes;