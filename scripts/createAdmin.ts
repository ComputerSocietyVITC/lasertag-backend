import { createAdmin } from "../models/admin";
import dbPool from "../config/db";
import bcrypt from "bcryptjs";

/**
 * CLI Script to create a new admin user
 * Usage: bun run scripts/createAdmin.ts <username> <password> [email]
 */

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error("Error: Missing required arguments");
        console.log("\nUsage: bun run scripts/createAdmin.ts <username> <password> [email]");
        console.log("\nExample: bun run scripts/createAdmin.ts admin admin123 admin@example.com");
        process.exit(1);
    }

    const [username, password, email] = args;

    if (username.length < 3) {
        console.error("Error: Username must be at least 3 characters long");
        process.exit(1);
    }

    if (password.length < 6) {
        console.error("Error: Password must be at least 6 characters long");
        process.exit(1);
    }

    if (email && !email.includes("@")) {
        console.error("Error: Invalid email format");
        process.exit(1);
    }

    try {
        console.log("Creating admin user...");
        
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const admin = await createAdmin(username, passwordHash, email);

        console.log("Admin user created successfully!");
        console.log("\nAdmin Details:");
        console.log("─────────────────────────────────");
        console.log(`ID:         ${admin.id}`);
        console.log(`Username:   ${admin.username}`);
        console.log(`Email:      ${admin.email || 'N/A'}`);
        console.log(`Created At: ${admin.created_at}`);
        console.log("─────────────────────────────────");

    } catch (error: any) {
        console.error("Error creating admin:", error.message);
        
        if (error.code === "23505") {
            console.error("\nThis username or email already exists. Please choose a different one.");
        }
        
        process.exit(1);
    } finally {
        await dbPool.end();
    }
}

main();
