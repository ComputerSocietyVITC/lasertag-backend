import type { NextFunction, Response } from "express";
import type { AuthorizedRequest } from "../types";
import { checkUserInTeam, getUser } from "../models/user";
import { AppError } from "../types/error";

export const fetchSelf = async (req: AuthorizedRequest, res : Response , next : NextFunction) => {
    const user = await getUser(req.userId!);

    if(!user){
        throw new AppError('User not found', 404);
    }

    res.json({ user });
};


export const fetchUser = async (req: AuthorizedRequest, res : Response , next : NextFunction) => {
    const userId = req.params.id;
    const user = await getUser(userId);

    if(!user){
        throw new AppError('User not found', 404);
    }

    const isSameTeam = user.team 
        ? await checkUserInTeam(req.userId!, user.team.id.toString())
        : false;

    const sanitizedUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        is_leader: user.is_leader,
        created_at: user.created_at,
        ...(isSameTeam && { team: user.team, phone_no: user.phone_no })
    };

    res.json({ user: sanitizedUser });
};