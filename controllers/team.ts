import type { NextFunction, Response } from "express";
import type { AuthorizedRequest } from "../types";
import { assignTeam, getUser } from "../models/user";
import { AppError } from "../types/error";
import { createTeam } from "../models/teams";

export const makeTeam = async (req : AuthorizedRequest, res : Response, next : NextFunction) => {
    const user = await getUser(req.userId!);

    if(user?.team){
        throw new AppError('User already belongs to a team', 400);
    }

    const {name} = req.body;
    
    if(!name){
        throw new AppError('Team name is required', 400);
    }

    const team = await createTeam(name);
    await assignTeam(req.userId!, team.id , true);

    res.status(201).json({
        status: 'success',
        data: {
            team
        }
    });

}


export const joinTeam = async (req : AuthorizedRequest, res : Response, next : NextFunction) => {
    // TODO : Implement join team logic
    res.json({ message: "Join team route" });
}


export const exitTeam = async (req : AuthorizedRequest, res : Response, next : NextFunction) => {
    // TODO : Implement exit team logic
    res.json({ message: "Exit team route" });
}

export const makePublic = async (req : AuthorizedRequest, res : Response, next : NextFunction) => {
    // TODO : Implement toggle team leader logic
    res.json({ message: "Toggle team leader route" });
}

