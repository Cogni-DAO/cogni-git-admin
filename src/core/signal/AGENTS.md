# CogniAction Signal Domain

## Purpose
Domain logic for CogniAction blockchain events. Pure parsing and validation.

## Scope
- CogniAction event ABI decoding
- Domain object creation and validation
- Event data transformation
- Zod schema definitions

## Current Implementation
- **Empty**: Logic exists in `src/cogni.ts`, needs to be moved here
- **Planned**: `parser.ts` (ABI decoding) and `schema.ts` (validation)

## Domain Model
```typescript
CogniAction {
  dao: Address
  chainId: bigint
  repo: string
  action: string (PR_APPROVE, PR_MERGE, etc.)
  target: string (pull_request, etc.)
  pr: number
  commit: Hex
  extra: Hex
  executor: Address
}
```

## Guidelines
- No blockchain RPC calls (delegate to services)
- Pure event log parsing only
- Strong typing with Zod validation
- Immutable domain objects