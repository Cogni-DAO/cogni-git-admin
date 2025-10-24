import { Address, createPublicClient, http, Log } from 'viem';
import { sepolia } from 'viem/chains';

import { parseCogniAction } from '../core/signal/parser';
import { environment } from '../utils/env';

export const client = createPublicClient({
  chain: sepolia,
  transport: http(environment.EVM_RPC_URL)
});

export async function fetchCogniFromTx(txHash: `0x${string}`, contract: Address) {
  const rcpt = await client.getTransactionReceipt({ hash: txHash });

  for (const log of rcpt.logs) {
    if (log.address.toLowerCase() !== contract.toLowerCase()) continue;

    const parsed = parseCogniAction(log as Log);
    if (parsed) return { parsed, txHash, logIndex: Number(log.logIndex) };
  }

  return null;
}