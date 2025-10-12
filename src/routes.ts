import { Request, Response,Router } from 'express';
import { Application } from 'probot';

import { healthCheck } from './api/health/route';
import { handleCogniSignal } from './api/webhooks/onchain/cogni-signal/route';
import { rawJson,RequestWithRawBody } from './utils/hmac';

export function createApiRoutes(logger: Application['log'], app: Application): Router {
  const router = Router();
  
  // Health check endpoint
  router.get('/v1/health', healthCheck);
  
  // CogniSignal webhook endpoint
  // TODO: Add rate limiting - this route performs expensive operations (RPC calls, GitHub API)
  // without rate limiting protection. See work item for cogni-apps rate limiting implementation.
  router.use(rawJson());
  router.post('/v1/webhooks/onchain/cogni-signal', (req: Request, res: Response) => handleCogniSignal(req as RequestWithRawBody, res, logger, app));
  
  return router;
}