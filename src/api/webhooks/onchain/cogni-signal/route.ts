import { Request, Response } from 'express';
import { verifyAlchemyHmac } from '../../../../utils/hmac';
import { fetchCogniFromTx } from '../../../../services/rpc';

export async function handleCogniSignal(req: Request, res: Response, logger: any) {
  try {
    if (!verifyAlchemyHmac(req)) return res.status(401).send('bad signature');
    
    const logs = (req.body as any)?.event?.data?.block?.logs || [];
    let txHash = null;
    for (const log of logs) {
      if (log.transaction?.hash) {
        txHash = log.transaction.hash;
        break;
      }
    }
    if (!txHash) return res.status(400).send('missing txHash');
    
    const out = await fetchCogniFromTx(txHash, process.env.COGNI_SIGNAL_CONTRACT as `0x${string}`);
    if (!out) return res.status(204).end();
    
    const allowChain = BigInt(process.env.COGNI_CHAIN_ID!);
    const allowDao = (process.env.COGNI_ALLOWED_DAO || '').toLowerCase();
    
    if (out.parsed.chainId !== allowChain) return res.status(204).end();
    if (out.parsed.dao.toLowerCase() !== allowDao) return res.status(204).end();
    
    logger.info({ kind: 'CogniAction', txHash: out.txHash, logIndex: out.logIndex, ...out.parsed, chainId: out.parsed.chainId.toString() });
    return res.status(200).send('ok');
    
  } catch (e) { 
    logger.error(e);
    return res.status(500).send('error');
  }
}