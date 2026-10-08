import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare function getRiskWeights(req: Request, res: Response): Promise<void>;
export declare function updateRiskWeights(req: AuthenticatedRequest, res: Response): Promise<void>;
