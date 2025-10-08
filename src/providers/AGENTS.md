# Provider Adapters

## Purpose
Normalize different webhook provider payloads into consistent format for downstream processing.

## Scope
- Provider detection from headers/body
- Payload parsing and HMAC verification per provider
- Normalization to common interface

## Architecture
```typescript
interface WebhookAdapter {
  parse(body: any, headers: Record<string, string>): {
    txHashes: string[]
    provider: string
    deliveryId?: string
    receivedAt: number
  }
}
```

## Current Implementation
- **MVP**: Only Alchemy adapter planned
- **detect.ts**: Recognizes Alchemy, returns 204 for others

## Structure
- `onchain/` - Blockchain webhook providers
  - `alchemy.ts` - Alchemy payload format
  - `quicknode.ts` - Future: QuickNode format  
  - `helius.ts` - Future: Solana/Helius format
  - `detect.ts` - Provider detection logic

## Guidelines
- Adapters are stateless pure functions
- Only parse and verify HMAC for their provider
- Return consistent interface regardless of provider
- Unit test with real provider payloads