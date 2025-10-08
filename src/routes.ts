import { Router } from 'express';
import { healthCheck } from './api/health/route';
import { handleCogniSignal } from './api/webhooks/onchain/cogni-signal/route';
import { rawJson } from './utils/hmac';

export function createApiRoutes(logger: any): Router {
  const router = Router();
  
  // Health check endpoint
  router.get('/v1/health', healthCheck);
  
  // CogniSignal webhook endpoint
  router.use(rawJson());
  router.post('/v1/webhooks/onchain/cogni-signal', (req, res) => handleCogniSignal(req, res, logger));
  
  return router;
}