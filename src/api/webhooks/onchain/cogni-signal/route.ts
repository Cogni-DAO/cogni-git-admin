import { Request, Response } from 'express';
import { detectProvider } from '../../../../providers/onchain/detect';
import { getAdapter } from '../../../../providers/onchain/registry';
import { fetchCogniFromTx } from '../../../../services/rpc';
import { executeAction } from '../../../../core/actions/executor';
import { getInstallationId } from '../../../../core/auth/github';

export async function handleCogniSignal(req: Request, res: Response, logger: any, app: any) {
  try {
    const provider = detectProvider(req.headers as Record<string, string>, req.body);
    if (!provider) return res.status(204).end();
    
    const adapter = getAdapter(provider);
    if (!adapter.verifySignature(req.headers as Record<string, string>, req)) {
      return res.status(401).send('bad signature');
    }
    
    const { txHashes } = adapter.parse(req.body, req.headers as Record<string, string>);
    if (txHashes.length === 0) return res.status(204).end();
    
    const allowChain = BigInt(process.env.COGNI_CHAIN_ID!);
    const allowDao = (process.env.COGNI_ALLOWED_DAO || '').toLowerCase();
    
    let validEventsFound = 0;
    for (const txHash of txHashes) {
      const out = await fetchCogniFromTx(txHash as `0x${string}`, process.env.COGNI_SIGNAL_CONTRACT as `0x${string}`);
      if (!out) continue;
      if (out.parsed.chainId !== allowChain) continue;
      if (out.parsed.dao.toLowerCase() !== allowDao) continue;
      
      validEventsFound++;
      logger.info({ kind: 'CogniAction', txHash: out.txHash, logIndex: out.logIndex, ...out.parsed, chainId: out.parsed.chainId.toString() });
      
      // Get GitHub App installation ID for this DAO+repo
      const installationId = getInstallationId(out.parsed.dao, out.parsed.repo);
      
      // Get authenticated GitHub client from Probot app
      const github = await app.auth(installationId);
      
      // Execute the action
      const actionResult = await executeAction({
        dao: out.parsed.dao,
        chainId: out.parsed.chainId,
        repo: out.parsed.repo,
        action: out.parsed.action,
        target: out.parsed.target,
        pr: out.parsed.pr,
        commit: out.parsed.commit,
        extra: out.parsed.extra,
        executor: out.parsed.executor
      }, github, logger);
      
      logger.info({ kind: 'ActionResult', txHash: out.txHash, ...actionResult });
    }
    
    return validEventsFound > 0 ? res.status(200).send('ok') : res.status(204).end();
    
  } catch (e) { 
    logger.error(e);
    return res.status(500).send('error');
  }
}