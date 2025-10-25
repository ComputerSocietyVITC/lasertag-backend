import type { NextFunction, Response } from "express";
import type { AuthorizedRequest } from "../types";
import { assignTeam, getUser } from "../models/user";
import { AppError } from "../types/error";
import { createTeam, getTeamByInviteCode } from "../models/teams";

export const makeTeam = async (req : AuthorizedRequest, res : Response, next : NextFunction) => {
    const user = await getUser(req.userId!);

    if(user?.team_id){
        throw new AppError('User already belongs to a team', 409);
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

};


export const joinTeam = async (req : AuthorizedRequest, res : Response, next : NextFunction) => {
    const { invite_code } = req.body;
    const userId = req.userId!; 

    if (!invite_code || typeof invite_code !== 'string') {
        throw new AppError('Missing or invalid invite code in request body', 400); 
    }

    const user = await getUser(userId);

    if (!user) {
         throw new AppError('Authenticated user not found', 404); 
    }

    if (user.team_id) {
        throw new AppError('User already belongs to a team', 409);
    }

    const team = await getTeamByInviteCode(invite_code);
    if (!team) {
        throw new AppError('Invalid invite code', 404);
    }

    try {
        const updatedUser = await assignTeam(userId, team.id, false);

        res.status(200).json({
            status: 'success',
            data: {
                team: team, 
                user: {
                    ...updatedUser,
                    team_id: team.id, 
                    is_leader: false 
                }
            }
        });

    } catch (error: any) {
        if (error.message && error.message.includes('maximum 8 members')) {
             throw new AppError('Team is full (maximum 8 members)', 409);
        }

        throw error;
    }
};


export const exitTeam = async (req : AuthorizedRequest, res : Response, next : NextFunction) => {
    // TODO : Implement exit team logic
    res.json({ message: "Exit team route" });
};

export const makePublic = async (req : AuthorizedRequest, res : Response, next : NextFunction) => {
    // TODO : Implement toggle team leader logic
    res.json({ message: "Toggle team leader route" });
};

