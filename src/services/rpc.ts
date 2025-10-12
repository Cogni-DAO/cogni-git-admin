import { Address, createPublicClient, http, Log } from 'viem';
import { sepolia } from 'viem/chains';

import { tryParseCogniLog } from '../core/signal/parser';

export const client = createPublicClient({ 
  chain: sepolia, 
  transport: http(process.env.RPC_URL) 
});

export async function fetchCogniFromTx(txHash: `0x${string}`, contract: Address) {
  const rcpt = await client.getTransactionReceipt({ hash: txHash });
  
  for (const log of rcpt.logs) {
    if (log.address.toLowerCase() !== contract.toLowerCase()) continue;
    
    const parsed = tryParseCogniLog(log as Log);
    if (parsed) return { parsed, txHash, logIndex: Number(log.logIndex) };
  }
  
  return null;
}