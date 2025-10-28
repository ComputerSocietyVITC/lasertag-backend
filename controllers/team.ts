import type { NextFunction, Response } from "express";
import type { AuthorizedRequest, TypedAuthorizedRequest, TypedResponse } from "../types";
import { assignTeam, getUser, removeUserFromTeam, updateUserTeam, getUsersWithoutTeam } from "../models/user";
import { AppError } from "../types/error";
import { 
    createTeam, 
    toggleTeam, 
    getTeamByInviteCode, 
    getOldestMember,
    getTeamWithMemberCount,
    getTeamMembers,
    mergeTeams,
    createTeamWithMembers,
    removeAllMembersFromTeam
} from "../models/teams";
import type { MakePublicResponse } from "../types/routes";
import logger from "../utils/logger";

export const makeTeam = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    const user = await getUser(req.userId!);
    if (user?.team) {
        throw new AppError('User already belongs to a team', 409);
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

};


export const joinTeam = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    const { invite_code } = req.body;
    const userId = req.userId!;

    if (!invite_code || typeof invite_code !== 'string') {
        throw new AppError('Missing or invalid invite code in request body', 400);
    }

    const user = await getUser(userId);

    if (!user) {
        throw new AppError('Authenticated user not found', 404);
    }

    if (user.team) {
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

export const makePublic = async (req: AuthorizedRequest, res: TypedResponse<MakePublicResponse>, next: NextFunction) => {
    
    const user = await getUser(req.userId!)
    if (!user) { 
        throw new AppError("User not found" , 404);
    }
    if (!user.team) { 
        throw new AppError("User not in any team" , 404);
    }
    if (!user.is_leader) { 
        throw new AppError("User not leader" , 400);
    }

    const team = await toggleTeam(user.team.id, true)
    res.status(200).json({ message: "Team is made public", team: team });
}

export const exitTeam = async (req: AuthorizedRequest, res: TypedResponse<{ message: string }>, next: NextFunction) => {
    const user = await getUser(req.userId!)
    if (!user) { 
        throw new AppError("User not found" , 404); 
    }
    if (!user.team) { 
        throw new AppError("User not in any team" , 404); 
    }
    const team = user.team
    if (user.is_leader) {
        removeUserFromTeam(user.id)
        updateUserTeam(user.id, null, null)
        const oldestUser = await getOldestMember(team.id)
        if (oldestUser) { updateUserTeam(oldestUser, true, team.id) }
    } else {
        removeUserFromTeam(user.id)
        updateUserTeam(user.id, null, null)
    }
    return res.status(200).json({ message: "User removed from team" });
}

/**
 * Matchmaking Algorithm
 * 
 * Logic:
 * 1. Teams with 8 members stay intact
 * 2. Teams with < 8 members try to merge with other teams
 * 3. Priority: Keep teams together as much as possible
 * 4. If two teams can be merged to make 8, merge them (larger team's leader becomes leader)
 * 5. If both teams have 4 members, randomly choose leader
 * 6. After all merging possibilities, break remaining teams and create new 8-member teams
 * 7. Leftover members (mod 8) are added to any existing team
 */
export const mergeSwitch = async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
        logger.info("Merge Switch activated - Starting matchmaking");

        const teams = await getTeamWithMemberCount();
        
        const soloUsers = await getUsersWithoutTeam();
        
        logger.info(`Solo users found: ${soloUsers.length}`);

        if (teams.length === 0 && soloUsers.length === 0) {
            return res.status(200).json({
                status: 'success',
                message: 'No teams or users to process',
                data: { processed: 0, merged: 0, created: 0 }
            });
        }

        const fullTeams = teams.filter(t => parseInt(t.member_count.toString()) === 8);
        let incompleteTeams = teams.filter(t => parseInt(t.member_count.toString()) < 8);

        logger.info(`Full teams: ${fullTeams.length}, Incomplete teams: ${incompleteTeams.length}`);

        let mergedCount = 0;
        const processed = new Set<number>();

        for (let i = 0; i < incompleteTeams.length; i++) {
            if (processed.has(incompleteTeams[i].team_id)) continue;

            const team1 = incompleteTeams[i];
            const count1 = parseInt(team1.member_count.toString());

            for (let j = i + 1; j < incompleteTeams.length; j++) {
                if (processed.has(incompleteTeams[j].team_id)) continue;

                const team2 = incompleteTeams[j];
                const count2 = parseInt(team2.member_count.toString());

                if (count1 + count2 === 8) {
                    logger.info(`Merging team ${team1.team_id} (${count1}) with team ${team2.team_id} (${count2}) to form exactly 8 members`);

                    let newLeaderId: number;
                    if (count1 > count2) {
                        newLeaderId = team1.leader_id!;
                    } else if (count2 > count1) {
                        newLeaderId = team2.leader_id!;
                    } else {
                        newLeaderId = Math.random() < 0.5 ? team1.leader_id! : team2.leader_id!;
                    }

                    await mergeTeams(team2.team_id, team1.team_id, newLeaderId);
                    
                    processed.add(team1.team_id);
                    processed.add(team2.team_id);
                    mergedCount++;
                    break;
                }
            }
        }

        const remainingTeams = incompleteTeams.filter(t => !processed.has(t.team_id));
        
        logger.info(`After phase 1 - Remaining incomplete teams: ${remainingTeams.length}`);

        const allOrphanMembers: Array<{ user_id: number; username: string; is_leader: boolean }> = [];
        
        for (const soloUser of soloUsers) {
            logger.info(`Adding solo user ${soloUser.user_id} (${soloUser.username}) to matchmaking pool`);
            allOrphanMembers.push({
                user_id: soloUser.user_id,
                username: soloUser.username,
                is_leader: false
            });
        }
        
        for (const team of remainingTeams) {
            logger.info(`Breaking team ${team.team_id} (${team.member_count} members)`);
            const members = await getTeamMembers(team.team_id);
            allOrphanMembers.push(...members);
            await removeAllMembersFromTeam(team.team_id);
        }

        logger.info(`Total orphan members to redistribute: ${allOrphanMembers.length} (${soloUsers.length} solo + ${allOrphanMembers.length - soloUsers.length} from broken teams)`);

        let newTeamsCreated = 0;
        let memberIndex = 0;

        while (memberIndex + 8 <= allOrphanMembers.length) {
            const teamMembers = allOrphanMembers.slice(memberIndex, memberIndex + 8);
            const userIds = teamMembers.map(m => m.user_id);
            
            const formerLeader = teamMembers.find(m => m.is_leader);
            const leaderId = formerLeader ? formerLeader.user_id : teamMembers[0].user_id;

            const teamName = `Auto-Team-${Date.now()}-${newTeamsCreated + 1}`;
            
            logger.info(`Creating new team: ${teamName} with ${teamMembers.length} members`);
            await createTeamWithMembers(teamName, userIds, leaderId);
            
            newTeamsCreated++;
            memberIndex += 8;
        }

        let leftoverHandled = 0;
        if (memberIndex < allOrphanMembers.length) {
            const leftoverMembers = allOrphanMembers.slice(memberIndex);
            logger.info(`Leftover members: ${leftoverMembers.length}`);

            const currentTeams = await getTeamWithMemberCount();
            
            if (currentTeams.length > 0) {
                const targetTeam = currentTeams.find(t => parseInt(t.member_count.toString()) < 8) || currentTeams[0];
                
                logger.info(`Adding ${leftoverMembers.length} leftover members to team ${targetTeam.team_id}`);
                
                for (const member of leftoverMembers) {
                    await assignTeam(member.user_id.toString(), targetTeam.team_id, false);
                }
                leftoverHandled = leftoverMembers.length;
            } else if (leftoverMembers.length > 0) {
                const userIds = leftoverMembers.map(m => m.user_id);
                const formerLeader = leftoverMembers.find(m => m.is_leader);
                const leaderId = formerLeader ? formerLeader.user_id : leftoverMembers[0].user_id;
                const teamName = `Auto-Team-${Date.now()}-Leftover`;
                
                logger.info(`Creating new team with ${leftoverMembers.length} leftover members`);
                await createTeamWithMembers(teamName, userIds, leaderId);
                newTeamsCreated++;
                leftoverHandled = leftoverMembers.length;
            }
        }

        logger.info("Merge Switch completed successfully");

        res.status(200).json({
            status: 'success',
            message: 'Matchmaking completed successfully',
            data: {
                fullTeamsKept: fullTeams.length,
                teamsProcessed: incompleteTeams.length,
                teamsMerged: mergedCount,
                soloUsersProcessed: soloUsers.length,
                newTeamsCreated: newTeamsCreated,
                orphanMembersProcessed: allOrphanMembers.length,
                leftoverMembersHandled: leftoverHandled,
                summary: {
                    phase0: `Found ${soloUsers.length} solo users without teams`,
                    phase1: `Merged ${mergedCount} pairs of incomplete teams`,
                    phase2: `Broke ${remainingTeams.length} remaining incomplete teams`,
                    phase3: `Created ${newTeamsCreated} new teams from ${allOrphanMembers.length} total members (${soloUsers.length} solo + ${allOrphanMembers.length - soloUsers.length} from broken teams)`,
                    phase4: leftoverHandled > 0 ? `Handled ${leftoverHandled} leftover members` : 'No leftover members'
                }
            }
        });

    } catch (error) {
        logger.error("Merge Switch error:", error);
        throw error;
    }
};


