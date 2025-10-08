# Onchain Provider Adapters

## Purpose
Parse blockchain webhook payloads from different providers into normalized format.

## Scope
- Provider-specific payload parsing
- HMAC signature verification per provider
- Transaction hash extraction from various JSON shapes
- Normalization to common `{ txHashes: string[] }` format

## Current Implementation
- **alchemy.ts**: MVP - parses `body.event.data.block.logs[].transaction.hash`
- **detect.ts**: MVP - recognizes Alchemy headers, 204 for others
- **quicknode.ts**: Future - different payload structure
- **helius.ts**: Future - Solana webhook support

## Provider Differences
- **Alchemy**: Nested in `event.data.block.logs[]`
- **QuickNode**: Different JSON structure (TBD)
- **Helius**: Solana-specific format (TBD)

## Interface
```typescript
{
  txHashes: string[],
  provider: "alchemy"|"quicknode"|"helius",
  deliveryId?: string,
  receivedAt: number
}
```

## Guidelines
- Never assume payload structure across providers
- Handle HMAC verification per provider's spec
- Extract all txHashes from webhook (may be multiple)
- Keep adapters small and focused