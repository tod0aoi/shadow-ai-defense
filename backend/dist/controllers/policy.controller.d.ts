import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare function getPolicies(req: Request, res: Response): Promise<void>;
export declare function updatePolicy(req: AuthenticatedRequest, res: Response): Promise<void>;
