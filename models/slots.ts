import dbPool from "../config/db";

export interface Slot {
    id: number;
    start_time: Date;
    end_time: Date;
    booked_by: number | null;
    created_at: Date;
}

export interface SlotWithTeam extends Slot {
    team?: {
        id: number;
        name: string;
        invite_code: string;
    } | null;
}

export async function createSlot(startTime: Date, endTime: Date): Promise<Slot> {
    const { rows } = await dbPool.query(
        `INSERT INTO slots (start_time, end_time)
         VALUES ($1, $2)
         RETURNING id, start_time, end_time, booked_by, created_at`,
        [startTime, endTime]
    );
    return rows[0];
}

export async function deleteSlot(slotId: number): Promise<boolean> {
    const { rowCount } = await dbPool.query(
        `DELETE FROM slots WHERE id = $1`,
        [slotId]
    );
    return rowCount !== null && rowCount > 0;
}

export async function getAllSlots(): Promise<SlotWithTeam[]> {
    const { rows } = await dbPool.query(
        `SELECT 
            slots.id,
            slots.start_time,
            slots.end_time,
            slots.booked_by,
            slots.created_at,
            CASE 
                WHEN teams.id IS NOT NULL THEN 
                    json_build_object(
                        'id', teams.id,
                        'name', teams.name,
                        'invite_code', teams.invite_code
                    )
                ELSE NULL
            END as team
         FROM slots
         LEFT JOIN teams ON slots.booked_by = teams.id
         ORDER BY slots.start_time ASC`
    );
    return rows;
}

export async function getSlotById(slotId: number): Promise<SlotWithTeam | null> {
    const { rows } = await dbPool.query(
        `SELECT 
            slots.id,
            slots.start_time,
            slots.end_time,
            slots.booked_by,
            slots.created_at,
            CASE 
                WHEN teams.id IS NOT NULL THEN 
                    json_build_object(
                        'id', teams.id,
                        'name', teams.name,
                        'invite_code', teams.invite_code
                    )
                ELSE NULL
            END as team
         FROM slots
         LEFT JOIN teams ON slots.booked_by = teams.id
         WHERE slots.id = $1`,
        [slotId]
    );
    return rows[0] || null;
}

export async function bookSlot(slotId: number, teamId: number): Promise<SlotWithTeam> {
    const client = await dbPool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { rows: lockRows } = await client.query(
            `SELECT id, start_time, end_time, booked_by, created_at
             FROM slots
             WHERE id = $1
             FOR UPDATE`,
            [slotId]
        );
        
        if (lockRows.length === 0) {
            throw new Error('Slot not found');
        }
        
        const slot = lockRows[0];
        
        if (slot.booked_by !== null) {
            throw new Error('Slot not available or already booked');
        }
        
        const { rows } = await client.query(
            `UPDATE slots
             SET booked_by = $2
             WHERE id = $1
             RETURNING id, start_time, end_time, booked_by, created_at`,
            [slotId, teamId]
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

export async function leaveSlot(slotId: number, teamId: number): Promise<SlotWithTeam> {
    const client = await dbPool.connect();
    
    try {
        await client.query('BEGIN');
        
        const { rows: lockRows } = await client.query(
            `SELECT id, start_time, end_time, booked_by, created_at
             FROM slots
             WHERE id = $1
             FOR UPDATE`,
            [slotId]
        );
        
        if (lockRows.length === 0) {
            throw new Error('Slot not found or not booked by this team');
        }
        
        const slot = lockRows[0];
        
        if (slot.booked_by !== teamId) {
            throw new Error('Slot not found or not booked by this team');
        }
        
        const { rows } = await client.query(
            `UPDATE slots
             SET booked_by = NULL
             WHERE id = $1 AND booked_by = $2
             RETURNING id, start_time, end_time, booked_by, created_at`,
            [slotId, teamId]
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

export async function getTeamSlot(teamId: number): Promise<SlotWithTeam | null> {
    const { rows } = await dbPool.query(
        `SELECT 
            slots.id,
            slots.start_time,
            slots.end_time,
            slots.booked_by,
            slots.created_at,
            CASE 
                WHEN teams.id IS NOT NULL THEN 
                    json_build_object(
                        'id', teams.id,
                        'name', teams.name,
                        'invite_code', teams.invite_code
                    )
                ELSE NULL
            END as team
         FROM slots
         INNER JOIN teams ON slots.booked_by = teams.id
         WHERE teams.id = $1`,
        [teamId]
    );
    return rows[0] || null;
}
