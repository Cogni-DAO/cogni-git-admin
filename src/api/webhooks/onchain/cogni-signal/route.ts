import { Response } from 'express';
import { URL } from 'node:url';
import { Application } from 'probot';

import { executeAction } from '../../../../core/action_execution/executor';
import { getInstallationId } from '../../../../core/auth/github';
import { signalToLog } from '../../../../core/signal/signal';
import { detectProvider } from '../../../../providers/onchain/detect';
import { getAdapter } from '../../../../providers/onchain/registry';
import { fetchCogniFromTx } from '../../../../services/rpc';
import { environment } from '../../../../utils/env';
import { RequestWithRawBody } from '../../../../utils/hmac';


export async function handleCogniSignal(req: RequestWithRawBody, res: Response, logger: Application['log'], app: Application) {
  try {
    logger.info('🔄 [WEBHOOK] Processing CogniSignal webhook', {
      headers: Object.keys(req.headers),
      bodyType: typeof req.body,
      bodySize: JSON.stringify(req.body).length
    });

    const provider = detectProvider(req.headers as Record<string, string>, req.body);
    if (!provider) {
      logger.info('❌ [WEBHOOK] No provider detected, returning 400');
      return res.status(400).send('unknown webhook provider');
    }
    logger.info('✅ [WEBHOOK] Provider detected', { provider });

    const adapter = getAdapter(provider);
    if (!adapter.verifySignature(req.headers as Record<string, string>, req)) {
      logger.error('❌ [WEBHOOK] Signature verification failed');
      return res.status(401).send('bad signature');
    }
    logger.info('✅ [WEBHOOK] Signature verified');

    const { txHashes } = adapter.parse(req.body, req.headers as Record<string, string>);
    if (txHashes.length === 0) {
      logger.info('❌ [WEBHOOK] No transaction hashes found, returning 204');
      return res.status(204).end();
    }
    logger.info('✅ [WEBHOOK] Transaction hashes parsed', { txHashes });

    if (!environment.CHAIN_ID || !environment.DAO_ADDRESS || !environment.SIGNAL_CONTRACT) {
      logger.error('❌ [WEBHOOK] Required blockchain environment variables not configured');
      return res.status(500).send('Server configuration error');
    }
    
    const allowChain = BigInt(environment.CHAIN_ID);
    const allowDao = environment.DAO_ADDRESS.toLowerCase();

    let validEventsFound = 0;
    const validationErrors: string[] = [];

    for (const txHash of txHashes) {
      logger.info('🔍 [WEBHOOK] Processing transaction', { txHash });

      const out = await fetchCogniFromTx(txHash as `0x${string}`, environment.SIGNAL_CONTRACT as `0x${string}`);
      if (!out) {
        logger.info('❌ [WEBHOOK] No CogniAction events found in transaction', { txHash });
        continue;
      }
      logger.info('✅ [WEBHOOK] CogniAction event found', { txHash, event: out.parsed });

      if (out.parsed.chainId !== allowChain) {
        const errorMsg = `Chain ID mismatch for tx ${txHash}: got ${out.parsed.chainId}, expected ${allowChain}`;
        logger.info('❌ [WEBHOOK] Chain ID mismatch', {
          txHash,
          eventChainId: out.parsed.chainId.toString(),
          expectedChainId: allowChain.toString()
        });
        validationErrors.push(errorMsg);
        continue;
      }

      if (out.parsed.dao.toLowerCase() !== allowDao) {
        const errorMsg = `DAO address mismatch for tx ${txHash}: got ${out.parsed.dao.toLowerCase()}, expected ${allowDao}`;
        logger.info('❌ [WEBHOOK] DAO address mismatch', {
          txHash,
          eventDao: out.parsed.dao.toLowerCase(),
          expectedDao: allowDao
        });
        validationErrors.push(errorMsg);
        continue;
      }

      logger.info('✅ [WEBHOOK] Event validation passed', { txHash });

      validEventsFound++;
      logger.info({ 
        kind: 'CogniAction', 
        txHash: out.txHash, 
        logIndex: out.logIndex, 
        ...signalToLog(out.parsed)
      });

      // Parse repo from repoUrl for installation ID lookup
      const repoUrl = new URL(out.parsed.repoUrl);
      const repo = repoUrl.pathname.slice(1).replace(/\.git$/, '');

      // Get GitHub App installation ID for this DAO+repo
      logger.info('🔧 [WEBHOOK] Getting GitHub installation ID', { dao: out.parsed.dao, repo });
      const installationId = getInstallationId(out.parsed.dao, repo);
      logger.info('✅ [WEBHOOK] Installation ID retrieved', { installationId });

      // Get authenticated GitHub client from Probot app
      logger.info('🔧 [WEBHOOK] Authenticating GitHub client');
      const github = await app.auth(installationId);
      logger.info('✅ [WEBHOOK] GitHub client authenticated');

      // Execute the action
      logger.info('🚀 [WEBHOOK] Executing action', {
        action: out.parsed.action,
        target: out.parsed.target,
        "repoUrl": out.parsed.repoUrl,
        resource: out.parsed.resource
      });
      const actionResult = await executeAction(out.parsed, github, logger);

      logger.info('✅ [WEBHOOK] Action executed', { kind: 'ActionResult', txHash: out.txHash, ...actionResult });
    }

    // Determine appropriate response based on processing results
    if (validEventsFound > 0) {
      logger.info('📊 [WEBHOOK] Processing complete - success', {
        validEventsFound,
        validationErrors: validationErrors.length,
        responseCode: 200
      });
      return res.status(200).send('ok');
    } else if (validationErrors.length > 0) {
      logger.info('📊 [WEBHOOK] Processing complete - validation errors', {
        validEventsFound,
        validationErrors: validationErrors.length,
        responseCode: 422
      });
      return res.status(422).json({
        error: 'validation failed',
        details: validationErrors
      });
    } else {
      logger.info('📊 [WEBHOOK] Processing complete - no relevant events', {
        validEventsFound,
        validationErrors: validationErrors.length,
        responseCode: 204
      });
      return res.status(204).end();
    }

  } catch (e) {
    logger.error('💥 [WEBHOOK] Fatal error during processing', e);
    return res.status(500).send('error');
  }
}