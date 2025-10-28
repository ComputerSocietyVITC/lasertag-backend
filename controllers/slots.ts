import type { Response } from "express";
import type { AuthorizedRequest } from "../types";
import { AppError } from "../types/error";
import * as SlotsModel from "../models/slots";
import { getUser } from "../models/user";

export async function createSlot(req: AuthorizedRequest, res: Response) {
    const { start_time, end_time } = req.body;

    if (!start_time || !end_time) {
        throw new AppError('start_time and end_time are required', 400);
    }

    const startTime = new Date(start_time);
    const endTime = new Date(end_time);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new AppError('Invalid date format', 400);
    }

    if (startTime >= endTime) {
        throw new AppError('start_time must be before end_time', 400);
    }

    if (startTime < new Date()) {
        throw new AppError('Cannot create slot in the past', 400);
    }

    try {
        const slot = await SlotsModel.createSlot(startTime, endTime);
        res.status(201).json({
            success: true,
            message: 'Slot created successfully',
            data: slot
        });
    } catch (error: any) {
        if (error.code === '23505') {
            throw new AppError('Slot with this time range already exists', 409);
        }
        throw error;
    }
}

export async function deleteSlot(req: AuthorizedRequest, res: Response) {
    const { slotId } = req.params;

    if (!slotId || isNaN(parseInt(slotId))) {
        throw new AppError('Valid slot ID is required', 400);
    }

    const deleted = await SlotsModel.deleteSlot(parseInt(slotId));

    if (!deleted) {
        throw new AppError('Slot not found', 404);
    }

    res.status(200).json({
        success: true,
        message: 'Slot deleted successfully'
    });
}

export async function getAllSlots(req: AuthorizedRequest, res: Response) {
    const slots = await SlotsModel.getAllSlots();

    res.status(200).json({
        success: true,
        data: slots
    });
}

export async function getSlot(req: AuthorizedRequest, res: Response) {
    const { slotId } = req.params;

    if (!slotId || isNaN(parseInt(slotId))) {
        throw new AppError('Valid slot ID is required', 400);
    }

    const slot = await SlotsModel.getSlotById(parseInt(slotId));

    if (!slot) {
        throw new AppError('Slot not found', 404);
    }

    res.status(200).json({
        success: true,
        data: slot
    });
}

export async function bookSlot(req: AuthorizedRequest, res: Response) {
    const { slotId } = req.params;
    const userId = req.userId;

    if (!slotId || isNaN(parseInt(slotId))) {
        throw new AppError('Valid slot ID is required', 400);
    }

    if (!userId) {
        throw new AppError('User not authenticated', 401);
    }

    const user = await getUser(userId);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (!user.team) {
        throw new AppError('You must be part of a team to book a slot', 400);
    }

    if (!user.is_leader) {
        throw new AppError('Only team leaders can book slots', 403);
    }

    const existingSlot = await SlotsModel.getTeamSlot(user.team.id);
    if (existingSlot) {
        throw new AppError('Your team has already booked a slot. Please leave the current slot first.', 409);
    }

    try {
        const slot = await SlotsModel.bookSlot(parseInt(slotId), user.team.id);
        res.status(200).json({
            success: true,
            message: 'Slot booked successfully',
            data: slot
        });
    } catch (error: any) {
        if (error.message === 'Slot not available or already booked') {
            throw new AppError('Slot not available or already booked', 409);
        }
        throw error;
    }
}

export async function leaveSlot(req: AuthorizedRequest, res: Response) {
    const { slotId } = req.params;
    const userId = req.userId;

    if (!slotId || isNaN(parseInt(slotId))) {
        throw new AppError('Valid slot ID is required', 400);
    }

    if (!userId) {
        throw new AppError('User not authenticated', 401);
    }

    const user = await getUser(userId);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (!user.team) {
        throw new AppError('You must be part of a team', 400);
    }

    if (!user.is_leader) {
        throw new AppError('Only team leaders can leave slots', 403);
    }

    try {
        const slot = await SlotsModel.leaveSlot(parseInt(slotId), user.team.id);
        res.status(200).json({
            success: true,
            message: 'Successfully left the slot',
            data: slot
        });
    } catch (error: any) {
        if (error.message === 'Slot not found or not booked by this team') {
            throw new AppError('Slot not found or not booked by your team', 404);
        }
        throw error;
    }
}

export async function getMyTeamSlot(req: AuthorizedRequest, res: Response) {
    const userId = req.userId;

    if (!userId) {
        throw new AppError('User not authenticated', 401);
    }

    const user = await getUser(userId);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (!user.team) {
        throw new AppError('You are not part of any team', 400);

    }

    const slot = await SlotsModel.getTeamSlot(user.team.id);

    res.status(200).json({
        success: true,
        data: slot
    });
}
