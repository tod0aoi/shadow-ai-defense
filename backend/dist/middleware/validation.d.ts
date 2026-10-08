import { Request, Response, NextFunction } from 'express';
/**
 * Validates login request payload.
 */
export declare function validateLoginPayload(req: Request, res: Response, next: NextFunction): void;
/**
 * Validates AI usage event ingestion payload.
 */
export declare function validateIngestPayload(req: Request, res: Response, next: NextFunction): void;
