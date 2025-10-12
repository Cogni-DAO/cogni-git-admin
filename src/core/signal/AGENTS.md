# CogniAction Signal Domain

## Purpose
Domain logic for CogniAction blockchain events. Pure parsing and validation.

## Scope
- CogniAction event ABI decoding
- Domain object creation and validation
- Event data transformation
- Zod schema definitions

## Current Implementation
- **`parser.ts`**: CogniAction event ABI decoding and parsing
  - Exports `abi` for event signature
  - Exports `COGNI_TOPIC0` event topic hash
  - `tryParseCogniLog()` decodes raw logs into structured CogniAction objects
- **`schema.ts`**: Zod validation schemas (if present)

## Domain Model
```typescript
CogniActionParsed {
  dao: string          // DAO address
  chainId: bigint      // Blockchain ID
  repo: string         // GitHub repo (owner/name)
  action: string       // Action type (PR_APPROVE, ADD_ADMIN, etc.)
  target: string       // Target type (pull_request, repository, etc.)
  pr: number          // PR number (0 if not applicable)
  commit: string      // Commit hash
  extra: string       // Additional data (hex encoded)
  executor: string    // Executor address
}
```

## Supported Actions
- **PR_APPROVE**: Approve and merge pull requests
- **ADD_ADMIN**: Add repository administrators
- Additional actions can be added via the action_execution registry

## Guidelines
- No blockchain RPC calls (delegate to services)
- Pure event log parsing only
- Strong typing with Zod validation
- Immutable domain objects