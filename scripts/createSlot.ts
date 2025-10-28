import { createSlot } from "../models/slots";
import dbPool from "../config/db";

/**
 * CLI Script to create new time slots
 * Usage: bun run scripts/createSlot.ts <start_time> <end_time>
 * 
 * Date format: YYYY-MM-DD HH:MM or ISO format
 * 
 * Examples:
 *   bun run scripts/createSlot.ts "2025-10-30 10:00" "2025-10-30 11:00"
 *   bun run scripts/createSlot.ts "2025-10-30T10:00:00" "2025-10-30T11:00:00"
 */

function parseDateTime(dateTimeStr: string): Date {
    // Try to parse various date formats
    let date: Date;
    
    // If format is like "2025-10-30 10:00", convert to ISO
    if (dateTimeStr.includes(" ") && !dateTimeStr.includes("T")) {
        dateTimeStr = dateTimeStr.replace(" ", "T");
    }
    
    date = new Date(dateTimeStr);
    
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${dateTimeStr}`);
    }
    
    return date;
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error("Error: Missing required arguments");
        console.log("\nUsage: bun run scripts/createSlot.ts <start_time> <end_time>");
        console.log("\nDate format: YYYY-MM-DD HH:MM or ISO format");
        console.log("\nExamples:");
        console.log('  bun run scripts/createSlot.ts "2025-10-30 10:00" "2025-10-30 11:00"');
        console.log('  bun run scripts/createSlot.ts "2025-10-30T10:00:00" "2025-10-30T11:00:00"');
        console.log("\nTip: Wrap dates in quotes to handle spaces");
        process.exit(1);
    }

    const [startTimeStr, endTimeStr] = args;

    try {
        console.log("Parsing dates...");
        
        const startTime = parseDateTime(startTimeStr);
        const endTime = parseDateTime(endTimeStr);

        // Validate dates
        if (startTime >= endTime) {
            console.error("Error: start_time must be before end_time");
            process.exit(1);
        }

        const now = new Date();
        if (startTime < now) {
            console.error("Error: Cannot create slot in the past");
            console.log(`Current time: ${now.toISOString()}`);
            console.log(`Slot start:   ${startTime.toISOString()}`);
            process.exit(1);
        }

        console.log("\nCreating slot...");
        console.log(`Start: ${startTime.toLocaleString()}`);
        console.log(`End:   ${endTime.toLocaleString()}`);

        const slot = await createSlot(startTime, endTime);

        console.log("\n✓ Slot created successfully!");
        console.log("\nSlot Details:");
        console.log("─────────────────────────────────────────────────");
        console.log(`ID:         ${slot.id}`);
        console.log(`Start Time: ${new Date(slot.start_time).toLocaleString()}`);
        console.log(`End Time:   ${new Date(slot.end_time).toLocaleString()}`);
        console.log(`Duration:   ${(new Date(slot.end_time).getTime() - new Date(slot.start_time).getTime()) / (1000 * 60)} minutes`);
        console.log(`Booked By:  ${slot.booked_by || 'Available'}`);
        console.log(`Created At: ${new Date(slot.created_at).toLocaleString()}`);
        console.log("─────────────────────────────────────────────────");

    } catch (error: any) {
        console.error("\n✗ Error creating slot:", error.message);
        
        if (error.code === "23505") {
            console.error("\nA slot with this exact time range already exists.");
            console.error("Please choose a different time range.");
        }
        
        process.exit(1);
    } finally {
        await dbPool.end();
    }
}

main();
