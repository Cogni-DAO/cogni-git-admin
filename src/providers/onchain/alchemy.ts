import { verifyAlchemyHmac, RequestWithRawBody } from '../../utils/hmac';

export interface WebhookParseResult {
  txHashes: string[];
  provider: string;
  deliveryId?: string;
  receivedAt: number;
}

interface AlchemyWebhookBody {
  event?: {
    data?: {
      block?: {
        logs?: Array<{
          transaction?: {
            hash?: string;
          };
        }>;
      };
    };
  };
}

export const alchemyAdapter = {
  verifySignature(headers: Record<string, string>, rawReq: RequestWithRawBody): boolean {
    return verifyAlchemyHmac(rawReq);
  },

  parse(body: AlchemyWebhookBody, headers: Record<string, string>): WebhookParseResult {
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