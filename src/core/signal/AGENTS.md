# Signal Domain

## Purpose
Signal parsing and type definitions for CogniAction blockchain events.

## Architecture
- **Single Source of Truth**: Only `parser.ts` knows raw blockchain event structure
- **Clean Abstractions**: `Signal` type provides typed interface for app code
- **Minimal Surface Area**: ABI changes only affect `parser.ts` and `CogniSignal.json`

## Components
- **`signal.ts`**: Core `Signal` type and utilities
  - `Signal` interface with all parsed fields
  - `VCS` constant array and `Vcs` type with validation function
  - `RepoRef` parser for repository URL handling
  - `signalToLog()` for BigInt-safe logging
- **`parser.ts`**: Raw blockchain event parsing
  - `parseCogniAction()` converts blockchain logs to `Signal`
  - Validates vcs/action/target enums at parse time, normalizes VCS to lowercase
  - Returns null for invalid or unmatched events
  - Uses updated event signature with vcs field
- **`params.ts`**: Parameter validation and freshness checks  
  - `ensureFresh()` validates nonce and deadline
  - `parseMergeParams()`, `parseGrantParams()`, `parseRevokeParams()` - discriminated parameter parsing

## Signal Interface
```typescript
interface Signal {
  dao: string;         // DAO contract address
  chainId: bigint;     // Chain ID (11155111 for Sepolia)
  vcs: Vcs;           // "github" | "gitlab" | "radicle" 
  repoUrl: string;     // Full repository URL
  action: Action;      // "merge" | "grant" | "revoke"
  target: Target;      // "change" | "collaborator"
  resource: string;    // PR number or username
  nonce: bigint;       // Currently unused (0)
  deadline: number;    // Currently unused (0)
  paramsJson: string;  // Currently unused ("")
  executor: string;    // Transaction executor address
}
```

## VCS Type System
```typescript
export const VCS = ['github', 'gitlab', 'radicle'] as const;
export type Vcs = typeof VCS[number];
export function isValidVcs(x: unknown): x is Vcs
```

## Current Actions
- `merge:change` → Merge pull requests (resource: PR number)
- `grant:collaborator` → Add admins (resource: username)
- `revoke:collaborator` → Remove admins (resource: username)

## Usage Pattern
1. `parseCogniAction(log)` → `Signal | null`
2. `ensureFresh(signal.nonce, signal.deadline)` validates signal freshness
3. `parseParams(action, target, paramsJson)` dispatches to discriminated parsers
4. Action handlers receive `run(signal: Signal, ctx: ExecContext)`
5. Use `signalToLog(signal)` for safe JSON logging

## Parameter Handling  
- **Nonce**: Replay protection (MVP: accepts any nonce >= 0)
- **Deadline**: Unix timestamp validation (rejects expired signals)
- **ParamsJson**: Action-specific parameter types (MergeChangeParams, GrantCollaboratorParams, RevokeCollaboratorParams)