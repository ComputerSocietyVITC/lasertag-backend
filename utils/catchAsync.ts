import type { Request, Response, NextFunction } from "express";
import type { AuthorizedRequest } from "../types";

export const $ = (
    fn: (req: AuthorizedRequest, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: AuthorizedRequest, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
};