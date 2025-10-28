import type { Request, Response } from "express";

export interface AuthorizedRequest extends Request {
    userId?: string;
}

export interface TypedAuthorizedRequest<T> extends Request {
    body: T
}

export type TypedResponse<T> = Response<T>;