import dbPool from "../config/db";
import type { Team } from "../types/team";
import { generateRandomCode } from "../utils";

export async function createTeam(name: string, inviteCode?:string) : Promise<Team> {

    if(!inviteCode){
        inviteCode = generateRandomCode(10);
    }

    const {rows} = await dbPool.query(
        `INSERT INTO teams (name, invite_code)
         VALUES ($1, $2)
         RETURNING id, name, invite_code, created_at`,
        [name, inviteCode]
    );
    return rows[0];
}

export async function getTeam(teamId: number) : Promise<Team | null> {
    const {rows} = await dbPool.query(
        `SELECT id, name, invite_code, created_at
         FROM teams
         WHERE id = $1`,
        [teamId]
    );
    return rows[0] || null;
}

export async function getTeamByInviteCode(inviteCode: string) : Promise<Team | null> {
    const {rows} = await dbPool.query(
        `SELECT id, name, invite_code, created_at
         FROM teams
         WHERE invite_code = $1`,
        [inviteCode]
    );
    return rows[0] || null;
}

export async function toggleTeam(teamId: number) : Promise<Team> {
    const {rows} = await dbPool.query(
        `UPDATE teams
         SET is_public = false
         WHERE id = $1
         RETURNING id, name, invite_code, is_public, created_at`,
        [teamId]
    );
    return rows[0];
}