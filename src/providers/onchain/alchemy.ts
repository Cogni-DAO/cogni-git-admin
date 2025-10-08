import { verifyAlchemyHmac } from '../../utils/hmac';

export interface WebhookParseResult {
  txHashes: string[];
  provider: string;
  deliveryId?: string;
  receivedAt: number;
}

export const alchemyAdapter = {
  verifySignature(headers: Record<string, string>, rawReq: any): boolean {
    return verifyAlchemyHmac(rawReq);
  },

  parse(body: any, headers: Record<string, string>): WebhookParseResult {
    const logs = body?.event?.data?.block?.logs || [];
    const txHashes: string[] = [];
    
    for (const log of logs) {
      if (log.transaction?.hash) {
        txHashes.push(log.transaction.hash);
      }
    }

    return {
      txHashes,
      provider: 'alchemy',
      deliveryId: headers['x-alchemy-signature'] || undefined,
      receivedAt: Date.now()
    };
  }
};