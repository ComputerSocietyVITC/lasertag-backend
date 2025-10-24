import { createUser } from "../models/user";
import dbPool from "../config/db";
import bcrypt from "bcryptjs";

/**
 * CLI Script to create a new user
 * Usage: bun run scripts/createUser.ts <email> <username> <password>
 */

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 4) {
        console.error("Error: Missing required arguments");
        console.log("\nUsage: bun run scripts/createUser.ts <email> <username> <password> <phone_no>");
        console.log("\nExample: bun run scripts/createUser.ts test@test.com test test123 1234567890");
        process.exit(1);
    }

    const [email, username, password, phone_no] = args;

    if (!email.includes("@")) {
        console.error("Error: Invalid email format");
        process.exit(1);
    }

    if (username.length < 3) {
        console.error("Error: Username must be at least 3 characters long");
        process.exit(1);
    }

    if (password.length < 6) {
        console.error("Error: Password must be at least 6 characters long");
        process.exit(1);
    }

    try {
        console.log("Creating user...");
        
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const user = await createUser(email, username, passwordHash , phone_no);

        console.log("User created successfully!");
        console.log("\nUser Details:");
        console.log("─────────────────────────────────");
        console.log(`ID:         ${user.id}`);
        console.log(`Username:   ${user.username}`);
        console.log(`Email:      ${user.email}`);
        console.log(`Is Leader:  ${user.is_leader || false}`);
        console.log(`Created At: ${user.created_at}`);
        console.log("─────────────────────────────────");

    } catch (error: any) {
        console.error("Error creating user:", error.message);
        
        if (error.code === "23505") {
            console.error("\nThis username or email already exists. Please choose a different one.");
        }
        
        process.exit(1);
    } finally {
        await dbPool.end();
    }
}

main();
