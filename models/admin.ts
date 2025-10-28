import dbPool from "../config/db";
import type { Admin } from "../types/admin";

export async function createAdmin(
    username: string, 
    password_hash: string, 
    email?: string
): Promise<Admin> {
    const { rows } = await dbPool.query(
        `INSERT INTO admins (username, password_hash, email)
         VALUES ($1, $2, $3)
         RETURNING id, username, email, created_at, updated_at`,
        [username, password_hash, email || null]
    );
    return rows[0];
}

export async function getAdminByUsername(username: string): Promise<Admin | null> {
    const { rows } = await dbPool.query(
        `SELECT * FROM admins WHERE username = $1`,
        [username]
    );
    return rows[0] || null;
}

export async function getAdminByEmail(email: string): Promise<Admin | null> {
    const { rows } = await dbPool.query(
        `SELECT * FROM admins WHERE email = $1`,
        [email]
    );
    return rows[0] || null;
}

export async function getAdminById(id: number): Promise<Admin | null> {
    const { rows } = await dbPool.query(
        `SELECT id, username, email, created_at, updated_at 
         FROM admins 
         WHERE id = $1`,
        [id]
    );
    return rows[0] || null;
}

export async function getAllAdmins(): Promise<Admin[]> {
    const { rows } = await dbPool.query(
        `SELECT id, username, email, created_at, updated_at 
         FROM admins 
         ORDER BY created_at DESC`
    );
    return rows;
}
