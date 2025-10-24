# CogniAction Signal Domain

## Purpose
Domain logic for CogniAction blockchain events. Pure parsing and validation.

## Scope
- CogniAction event ABI decoding
- Domain object creation and validation
- Event data transformation
- Zod schema definitions

## Current Implementation
- **`parser.ts`**: CogniAction event ABI decoding and parsing with updated schema
  - Exports `abi` for event signature (5-parameter CogniAction event)
  - Exports `COGNI_TOPIC0` event topic hash for new schema
  - `tryParseCogniLog()` decodes raw logs into structured CogniAction objects with repoUrl, action, target, resource fields
- **`schema.ts`**: Zod validation schemas (if present)

## Domain Model (Updated Schema)
```typescript
CogniActionParsed {
  dao: string          // DAO address
  chainId: bigint      // Blockchain ID
  repoUrl: string      // Full repository URL (e.g., "https://github.com/owner/repo")
  action: string       // Canonical action name (merge, grant, revoke)
  target: string       // Provider-agnostic target (change, collaborator)
  resource: string     // Action-specific resource (PR number, username)
  extra: string        // Additional data (hex encoded)
  executor: string     // Executor address
}
```

## Supported Actions (Canonical Naming)
- **merge**: Merge pull requests (target: change, resource: PR number)
- **grant**: Add repository administrators (target: collaborator, resource: username)
- **revoke**: Remove repository administrators (target: collaborator, resource: username)
- Additional actions can be added via the action_execution registry with provider-agnostic naming

## Guidelines
- No blockchain RPC calls (delegate to services)
- Pure event log parsing only
- Strong typing with Zod validation
- Immutable domain objects