import { Router } from "express";
import { $ } from "../utils/catchAsync";
import { verifyJWT, verifyAdmin } from "../middleware/verify";
import { bookSlot, createSlot, deleteSlot, getAllSlots, getMyTeamSlot, getSlot, leaveSlot } from "../controllers/slots";

const slotsRoute = Router();

slotsRoute.use(verifyJWT);

slotsRoute.get("/", $(getAllSlots));
slotsRoute.get("/my-team", $(getMyTeamSlot));
slotsRoute.get("/:slotId", $(getSlot));
slotsRoute.post("/:slotId/book", $(bookSlot));
slotsRoute.patch("/:slotId/leave", $(leaveSlot));


slotsRoute.use(verifyAdmin);

slotsRoute.post("/", $(createSlot));
slotsRoute.delete("/:slotId", $(deleteSlot));

export default slotsRoute;
