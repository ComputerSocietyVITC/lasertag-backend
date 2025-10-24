import type { Team } from "./team";

export interface User {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    team_id?: number | null;
    is_leader?: boolean;
    created_at: Date;
    phone_no?: string | null;
    team? : Team | null;
}