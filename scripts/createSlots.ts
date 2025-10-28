import { createSlot } from "../models/slots";
import dbPool from "../config/db";

/**
 * CLI Script to create multiple time slots for a day
 * Usage: bun run scripts/createSlots.ts <date> <start_hour> <end_hour> <slot_duration_minutes>
 * 
 * Examples:
 *   Create 1-hour slots from 9 AM to 5 PM on Oct 30:
 *   bun run scripts/createSlots.ts "2025-10-30" 9 17 60
 * 
 *   Create 30-minute slots from 10 AM to 2 PM on Nov 1:
 *   bun run scripts/createSlots.ts "2025-11-01" 10 14 30
 */

function parseDate(dateStr: string): Date {
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${dateStr}`);
    }
    
    return date;
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 4) {
        console.error("Error: Missing required arguments");
        console.log("\nUsage: bun run scripts/createSlots.ts <date> <start_hour> <end_hour> <slot_duration_minutes>");
        console.log("\nArguments:");
        console.log("  date                    - Date in YYYY-MM-DD format");
        console.log("  start_hour              - Starting hour (0-23)");
        console.log("  end_hour                - Ending hour (0-23)");
        console.log("  slot_duration_minutes   - Duration of each slot in minutes");
        console.log("\nExamples:");
        console.log('  Create 1-hour slots from 9 AM to 5 PM:');
        console.log('  bun run scripts/createSlots.ts "2025-10-30" 9 17 60');
        console.log('\n  Create 30-minute slots from 10 AM to 2 PM:');
        console.log('  bun run scripts/createSlots.ts "2025-11-01" 10 14 30');
        process.exit(1);
    }

    const [dateStr, startHourStr, endHourStr, durationStr] = args;

    try {
        const baseDate = parseDate(dateStr);
        const startHour = parseInt(startHourStr);
        const endHour = parseInt(endHourStr);
        const duration = parseInt(durationStr);

        // Validate inputs
        if (isNaN(startHour) || startHour < 0 || startHour > 23) {
            console.error("Error: start_hour must be between 0 and 23");
            process.exit(1);
        }

        if (isNaN(endHour) || endHour < 0 || endHour > 23) {
            console.error("Error: end_hour must be between 0 and 23");
            process.exit(1);
        }

        if (isNaN(duration) || duration <= 0) {
            console.error("Error: slot_duration_minutes must be a positive number");
            process.exit(1);
        }

        if (startHour >= endHour) {
            console.error("Error: start_hour must be before end_hour");
            process.exit(1);
        }

        // Calculate number of slots
        const totalMinutes = (endHour - startHour) * 60;
        const numberOfSlots = Math.floor(totalMinutes / duration);

        console.log("\nSlot Creation Plan:");
        console.log("─────────────────────────────────────────────────");
        console.log(`Date:           ${baseDate.toDateString()}`);
        console.log(`Time Range:     ${startHour}:00 - ${endHour}:00`);
        console.log(`Slot Duration:  ${duration} minutes`);
        console.log(`Number of Slots: ${numberOfSlots}`);
        console.log("─────────────────────────────────────────────────");

        if (numberOfSlots === 0) {
            console.error("\nError: Time range too small for specified slot duration");
            process.exit(1);
        }

        console.log("\nCreating slots...\n");

        const createdSlots = [];
        const skippedSlots = [];
        let currentTime = startHour * 60; // Convert to minutes

        for (let i = 0; i < numberOfSlots; i++) {
            const startMinutes = currentTime;
            const endMinutes = currentTime + duration;

            // Create Date objects
            const startTime = new Date(baseDate);
            startTime.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

            const endTime = new Date(baseDate);
            endTime.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);

            try {
                // Check if slot is in the past
                const now = new Date();
                if (startTime < now) {
                    console.log(`⊘ Skipped (past): ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
                    skippedSlots.push({ startTime, endTime, reason: 'past' });
                    currentTime += duration;
                    continue;
                }

                const slot = await createSlot(startTime, endTime);
                console.log(`✓ Created slot #${slot.id}: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
                createdSlots.push(slot);
            } catch (error: any) {
                if (error.code === "23505") {
                    console.log(`⊘ Skipped (exists): ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
                    skippedSlots.push({ startTime, endTime, reason: 'exists' });
                } else {
                    console.error(`✗ Error: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}: ${error.message}`);
                    skippedSlots.push({ startTime, endTime, reason: 'error' });
                }
            }

            currentTime += duration;
        }

        console.log("\n─────────────────────────────────────────────────");
        console.log("Summary:");
        console.log(`✓ Successfully created: ${createdSlots.length} slot(s)`);
        console.log(`⊘ Skipped: ${skippedSlots.length} slot(s)`);
        console.log("─────────────────────────────────────────────────");

        if (createdSlots.length === 0) {
            console.log("\nNo new slots were created.");
        } else {
            console.log("\nSlots created successfully!");
        }

    } catch (error: any) {
        console.error("\n✗ Error:", error.message);
        process.exit(1);
    } finally {
        await dbPool.end();
    }
}

main();
