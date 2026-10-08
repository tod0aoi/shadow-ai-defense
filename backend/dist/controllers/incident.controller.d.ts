import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare function getIncidents(req: Request, res: Response): Promise<void>;
export declare function getIncidentById(req: Request, res: Response): Promise<void>;
export declare function updateIncidentStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function triggerAIAnalysis(req: AuthenticatedRequest, res: Response): Promise<void>;
