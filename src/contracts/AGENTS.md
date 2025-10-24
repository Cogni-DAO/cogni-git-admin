# Smart Contract Interfaces

## Purpose
Contract ABI definitions and type-safe interfaces for blockchain interactions.

## Scope
- Contract ABI JSON files
- Type definitions for contract events
- Contract address constants

## Current Implementation

### ABI Files
- `abi/CogniSignal.json` - CogniSignal contract ABI with 6-parameter signal() function and CogniAction event including vcs field
- `abi/AdminPlugin.json` - Aragon Admin Plugin ABI for DAO proposal execution

### CogniSignal Function Signature
```solidity
function signal(string vcs, string repoUrl, string action, string target, string resource, bytes extra)
```

Parameters:
- `vcs`: VCS provider (github, gitlab, radicle)
- `repoUrl`: Repository URL  
- `action`: Operation type (merge, grant, revoke)
- `target`: Target resource (change, collaborator)
- `resource`: Specific resource (PR number, username)
- `extra`: ABI-encoded parameters (nonce, deadline, paramsJson)

### ABI Usage Pattern
- **Production**: `src/core/signal/parser.ts` uses inline `parseAbi()` definitions
- **Tests**: E2E tests use inline ABI definitions for reliability
- **Rationale**: Inline definitions provide compile-time safety and avoid runtime file loading

## Migration Considerations

### JSON Import Option
ABI files can be imported directly when needed:
```typescript
import cogniSignalAbi from '../contracts/abi/CogniSignal.json';
```

### Prerequisites
- TypeScript config has `resolveJsonModule: true` (enabled)
- JSON ABI files are properly formatted

## Structure
- `abi/CogniSignal.json` - CogniSignal contract ABI (reference for tooling/future use)
- `abi/AdminPlugin.json` - Admin Plugin ABI (reference for tooling/future use)
- **Production**: `src/core/signal/parser.ts` uses inline definitions
- **Tests**: Inline `parseAbi()` definitions for maximum reliability

## Guidelines
- Keep ABI files in sync with deployed contracts
- ABI files serve as source of truth for external tooling integration
- Only migrate production code when there's clear benefit
- Never change working test code without strong justification
- Generate types from ABI where possible for future improvements