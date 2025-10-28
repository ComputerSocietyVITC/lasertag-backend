import dbPool from "../config/db";
import type { User } from "../types/user";

export async function createUser(email: string, username: string, password_hash: string, phone_no: string): Promise<User> {
    const { rows } = await dbPool.query(
        `INSERT INTO users (username, email, password_hash, phone_no)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, email, is_leader, created_at`,
        [username, email, password_hash, phone_no]
    );
    return rows[0];
}


export async function assignTeam(userId: string, teamId: number, is_leader = false): Promise<User> {
    const client = await dbPool.connect();
    try {
        await client.query('BEGIN');

        const { rows } = await client.query(
            `UPDATE users
             SET team_id = $1, is_leader = $2
             WHERE id = $3
             RETURNING id, username, email, is_leader, created_at, team_id`,
            [teamId, is_leader, userId]
        );

        await client.query(
            `INSERT INTO team_members (team_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT (team_id, user_id) DO NOTHING`,
            [teamId, userId]
        );

        await client.query('COMMIT');
        return rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function checkUserInTeam(userId: string, teamId: string): Promise<boolean> {
    const { rows } = await dbPool.query(
        `SELECT 1 FROM team_members
         WHERE user_id = $1 AND team_id = $2`,
        [userId, teamId]
    );
    return rows.length > 0;
}

export async function getUser(userId: string): Promise<User | null> {
    const { rows } = await dbPool.query(
        `SELECT users.id, 
                users.username, 
                users.email, 
                users.phone_no,
                users.is_leader, 
                users.created_at,
                row_to_json(teams) as team
         FROM users
         LEFT JOIN teams ON users.team_id = teams.id
         WHERE users.id = $1`,
        [userId]
    );
    return rows[0] || null;
}

export async function removeUserFromTeam(userId: number) {
    await dbPool.query(
        `DELETE FROM team_members WHERE user_id = $1`, [userId]
    )
}


export async function getUserByEmail(email: string): Promise<User | null> {
    const { rows } = await dbPool.query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
    );
    return rows[0] || null;
}

export async function updateUserTeam(
    userId: number,
    isLeader: boolean | null | undefined,
    team_id: number | null | undefined
): Promise<User> {
    const dbIsLeader = isLeader ?? null;
    const dbTeamId = team_id ?? null;
    const { rows } = await dbPool.query(
        `UPDATE users
         SET is_leader = $1,
             team_id = $2
         WHERE id = $3
         RETURNING *`
        , [dbIsLeader, dbTeamId, userId]
    );
    return rows[0] as User;
}

export async function getUsersWithoutTeam(): Promise<Array<{ user_id: number; username: string }>> {
    const { rows } = await dbPool.query(
        `SELECT id as user_id, username 
         FROM users 
         WHERE team_id IS NULL
         ORDER BY created_at ASC`
    );
    return rows;
}