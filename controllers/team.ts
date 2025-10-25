import type { NextFunction, Response } from "express";
import type { AuthorizedRequest, TypedResponse } from "../types";
import { assignTeam, getUser, removeUserFromTeam, updateUserTeam } from "../models/user";
import { AppError } from "../types/error";
import { createTeam, getOldestMember, getTeam } from "../models/teams";

export const makeTeam = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    const user = await getUser(req.userId!);

    if (user?.team) {
        throw new AppError('User already belongs to a team', 400);
    }

    const { name } = req.body;

    if (!name) {
        throw new AppError('Team name is required', 400);
    }

    const team = await createTeam(name);
    await assignTeam(req.userId!, team.id, true);

    res.status(201).json({
        status: 'success',
        data: {
            team
        }
    });

}


export const joinTeam = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    // TODO : Implement join team logic
    res.json({ message: "Join team route" });
}


export const exitTeam = async (req: AuthorizedRequest, res: TypedResponse<{ message: string }>, next: NextFunction) => {
    if (typeof req.userId !== 'string') { return res.status(400).json({ message: "Invalid parameters" }) }
    const user = await getUser(req.userId)
    if (user == null) { return res.status(404).json({ message: "User not found" }) }
    if (user.team_id == null) { return res.status(404).json({ message: "User not in any team" }) }
    const teamId = user.team_id
    if (user.is_leader) {
        removeUserFromTeam(user.id)
        updateUserTeam(user.id, null, null)
        const oldestUser = await getOldestMember(teamId)
        if (oldestUser) { updateUserTeam(oldestUser, true, teamId) }
    } else {
        removeUserFromTeam(user.id)
        updateUserTeam(user.id, null, null)
    }
    return res.status(200).json({ message: "User removed from team" });
}

export const makePublic = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    // TODO : Implement toggle team leader logic
    res.json({ message: "Toggle team leader route" });
}

