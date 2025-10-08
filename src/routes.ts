import { Router, Request, Response } from 'express';
import { Application } from 'probot';
import { RequestWithRawBody, rawJson } from './utils/hmac';
import { healthCheck } from './api/health/route';
import { handleCogniSignal } from './api/webhooks/onchain/cogni-signal/route';

export function createApiRoutes(logger: Application['log'], app: Application): Router {
  const router = Router();
  
  // Health check endpoint
  router.get('/v1/health', healthCheck);
  
  // CogniSignal webhook endpoint
  router.use(rawJson());
  router.post('/v1/webhooks/onchain/cogni-signal', (req: Request, res: Response) => handleCogniSignal(req as RequestWithRawBody, res, logger, app));
  
  return router;
}