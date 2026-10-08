import { Request, Response } from 'express';
export declare function scanText(req: Request, res: Response): Promise<void>;
export declare function ingestEvent(req: Request, res: Response): Promise<void>;
export declare function getEvents(req: Request, res: Response): Promise<void>;
export declare function getEventById(req: Request, res: Response): Promise<void>;
