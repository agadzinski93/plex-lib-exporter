import { Request, Response, NextFunction } from "express"

type errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => void;

type sendOptionsResponseFn = (methods: string[], res: Response) => string;
type verifyMethodsFn = (methods: string[]) => (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
type authenticateFn = (req: Request, res: Response, next: NextFunction) => void;

export type {
    errorMiddleware,
    sendOptionsResponseFn,
    verifyMethodsFn,
    authenticateFn
}