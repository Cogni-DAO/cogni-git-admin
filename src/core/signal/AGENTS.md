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
  - `RepoRef` parser for repository URL handling
  - `signalToLog()` for BigInt-safe logging
- **`parser.ts`**: Raw blockchain event parsing
  - `parseCogniAction()` converts blockchain logs to `Signal`
  - Validates action/target enums at parse time
  - Returns null for invalid or unmatched events
- **`params.ts`**: Parameter validation and freshness checks
  - `ensureFresh()` validates nonce and deadline
  - `parseParams()` handles VCS-specific parameter parsing

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

## Current Actions
- `merge:change` → Merge pull requests (resource: PR number)
- `grant:collaborator` → Add admins (resource: username)
- `revoke:collaborator` → Remove admins (resource: username)

## Usage Pattern
1. `parseCogniAction(log)` → `Signal | null`
2. `ensureFresh(signal.nonce, signal.deadline)` validates signal freshness
3. `parseParams(vcs, target, action, paramsJson)` extracts action parameters
4. Action handlers receive `run(signal: Signal, ctx: ExecContext)`
5. Use `signalToLog(signal)` for safe JSON logging

## Parameter Handling
- **Nonce**: Replay protection (MVP: accepts any nonce >= 0)
- **Deadline**: Unix timestamp validation (rejects expired signals)
- **ParamsJson**: VCS-specific parameter parsing and validation