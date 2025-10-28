import dbPool from "../config/db";
import type { Team } from "../types/team";
import { generateRandomCode } from "../utils";

export async function createTeam(name: string, inviteCode?: string): Promise<Team> {

    if (!inviteCode) {
        inviteCode = generateRandomCode(10);
    }

    const { rows } = await dbPool.query(
        `INSERT INTO teams (name, invite_code)
         VALUES ($1, $2)
         RETURNING id, name, invite_code, created_at`,
        [name, inviteCode]
    );
    return rows[0];
}

export async function getTeam(teamId: number): Promise<Team | null> {
    const { rows } = await dbPool.query(
        `SELECT id, name, invite_code, created_at
         FROM teams
         WHERE id = $1`,
        [teamId]
    );
    return rows[0] || null;
}

export async function getTeamByInviteCode(inviteCode: string): Promise<Team | null> {
    const { rows } = await dbPool.query(
        `SELECT id, name, invite_code, created_at
         FROM teams
         WHERE invite_code = $1`,
        [inviteCode]
    );
    return rows[0] || null;
}

export async function toggleTeam(teamId: number, isPublic?: boolean): Promise<Team> {
    if (typeof isPublic === 'boolean') {
        const { rows } = await dbPool.query(
            `UPDATE teams
             SET is_public = $2
             WHERE id = $1
             RETURNING id, name, invite_code, is_public, created_at`,
            [teamId, isPublic]
        );
        return rows[0];
    }

    const { rows } = await dbPool.query(
        `UPDATE teams
         SET is_public = NOT is_public
         WHERE id = $1
         RETURNING id, name, invite_code, is_public, created_at`,
        [teamId]
    );
    return rows[0];
}

export async function getOldestMember(teamId: number): Promise<number | null> {
    const { rows } = await dbPool.query(
        `SELECT
            user_id
        FROM
            team_members
        WHERE
            team_id=$1
        ORDER BY
            joined_at ASC
        LIMIT 1;`, [teamId]
    )
    return rows?.[0]?.[0] ?? null;
}

export async function getTeamWithMemberCount(): Promise<Array<{ team_id: number; team_name: string; member_count: number; leader_id: number | null }>> {
    const { rows } = await dbPool.query(
        `SELECT 
            t.id as team_id,
            t.name as team_name,
            COUNT(tm.user_id) as member_count,
            (SELECT u.id FROM users u WHERE u.team_id = t.id AND u.is_leader = true LIMIT 1) as leader_id
         FROM teams t
         LEFT JOIN team_members tm ON t.id = tm.team_id
         GROUP BY t.id, t.name
         ORDER BY member_count DESC`
    );
    return rows;
}

export async function getTeamMembers(teamId: number): Promise<Array<{ user_id: number; username: string; is_leader: boolean }>> {
    const { rows } = await dbPool.query(
        `SELECT 
            u.id as user_id,
            u.username,
            u.is_leader
         FROM users u
         INNER JOIN team_members tm ON u.id = tm.user_id
         WHERE tm.team_id = $1
         ORDER BY u.is_leader DESC, tm.joined_at ASC`,
        [teamId]
    );
    return rows;
}

export async function deleteTeam(teamId: number): Promise<void> {
    await dbPool.query(`DELETE FROM teams WHERE id = $1`, [teamId]);
}

export async function mergeTeams(
    sourceTeamId: number, 
    targetTeamId: number, 
    newLeaderId: number
): Promise<void> {
    const client = await dbPool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            `UPDATE users 
             SET team_id = $1, is_leader = false 
             WHERE team_id = $2`,
            [targetTeamId, sourceTeamId]
        );

        await client.query(
            `UPDATE team_members 
             SET team_id = $1 
             WHERE team_id = $2`,
            [targetTeamId, sourceTeamId]
        );

        await client.query(
            `UPDATE users 
             SET is_leader = true 
             WHERE id = $1 AND team_id = $2`,
            [newLeaderId, targetTeamId]
        );

        await client.query(`DELETE FROM teams WHERE id = $1`, [sourceTeamId]);

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function createTeamWithMembers(
    teamName: string, 
    userIds: number[], 
    leaderId: number
): Promise<Team> {
    const client = await dbPool.connect();
    try {
        await client.query('BEGIN');

        const inviteCode = generateRandomCode(10);
        const { rows: teamRows } = await client.query(
            `INSERT INTO teams (name, invite_code)
             VALUES ($1, $2)
             RETURNING id, name, invite_code, created_at`,
            [teamName, inviteCode]
        );
        const newTeam = teamRows[0];

        await client.query(
            `UPDATE users 
             SET team_id = $1, is_leader = false 
             WHERE id = ANY($2)`,
            [newTeam.id, userIds]
        );

        await client.query(
            `UPDATE users 
             SET is_leader = true 
             WHERE id = $1`,
            [leaderId]
        );

        const memberValues = userIds.map(userId => `(${newTeam.id}, ${userId})`).join(',');
        await client.query(
            `INSERT INTO team_members (team_id, user_id) VALUES ${memberValues}`
        );

        await client.query('COMMIT');
        return newTeam;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function removeAllMembersFromTeam(teamId: number): Promise<void> {
    const client = await dbPool.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            `UPDATE users 
             SET team_id = NULL, is_leader = false 
             WHERE team_id = $1`,
            [teamId]
        );

        await client.query(
            `DELETE FROM team_members WHERE team_id = $1`,
            [teamId]
        );

        await client.query(`DELETE FROM teams WHERE id = $1`, [teamId]);

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}