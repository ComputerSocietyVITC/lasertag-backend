import express from "express";
import { verifyJWT, verifyAdmin } from "../middleware/verify";
import { exitTeam, getAllPublicTeams, getMyTeam, joinTeam, kickTeamMember, makePublic, makeTeam, mergeSwitch } from "../controllers/team";
import { $ } from "../utils/catchAsync";

const teamRoutes = express.Router();

teamRoutes.use(verifyJWT);

teamRoutes.get("/public" , $(getAllPublicTeams));

teamRoutes.get("/me", $(getMyTeam));
teamRoutes.post("/create" , $(makeTeam));
teamRoutes.post("/join" , $(joinTeam));
teamRoutes.delete("/leave" , $(exitTeam));
teamRoutes.delete("/kick" , $(kickTeamMember));
teamRoutes.patch("/makePublic" , $(makePublic));
teamRoutes.patch("/exit" , $(exitTeam));

teamRoutes.use(verifyAdmin);
teamRoutes.patch("/merge-switch", $(mergeSwitch));

export default teamRoutes;