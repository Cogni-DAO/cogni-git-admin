# Smart Contract Interfaces

## Purpose
Contract ABI definitions and type-safe interfaces for blockchain interactions.

## Scope
- Contract ABI JSON files
- Type definitions for contract events
- Contract address constants

## Current Implementation Status

### Reference-Only ABI Files (Not Yet Used in Code)
- `abi/CogniSignal.json` - Complete CogniSignal contract ABI with signal() function and CogniAction event
- `abi/AdminPlugin.json` - Aragon Admin Plugin ABI for DAO proposal execution
- **Current approach**: Production code uses inline `parseAbi()` definitions for reliability

### Active ABI Usage (Inline Definitions)
- **`src/core/signal/parser.ts`**: Production CogniAction event parsing via `parseAbi()`
- **`e2e/tests/blockchain-integration.spec.ts`**: Test code with inline CogniSignal + AdminPlugin ABIs
- **`debug-admin.js`**: Debug script with inline ABI definitions

## Future Implementation Guide

### Simple Migration Path (Production Code)
The production parser (`src/core/signal/parser.ts`) can be easily updated:

**Current:**
```typescript
export const abi = parseAbi([
  'event CogniAction(address indexed dao,uint256 indexed chainId,string repo,string action,string target,uint256 pr,bytes32 commit,bytes extra,address indexed executor)'
]);
```

**Future (when ready):**
```typescript
import cogniSignalAbi from '../contracts/abi/CogniSignal.json';
export const abi = cogniSignalAbi.filter(item => item.type === 'event' && item.name === 'CogniAction');
```

### Prerequisites for Migration
- ✅ TypeScript config has `resolveJsonModule: true` (already enabled)
- ✅ JSON ABI files are properly formatted (already done)
- ⚠️ **Recommendation**: Keep working test code unchanged to avoid regression risk

### Complex Migration (Test/Debug Code)
Test files and debug scripts use multiple ABIs and are currently working reliably:
- **`e2e/tests/blockchain-integration.spec.ts`**: Uses both CogniSignal + AdminPlugin ABIs
- **`debug-admin.js`**: Temporary debug tooling with inline ABIs
- **Decision**: Leave as-is until there's a compelling reason to change

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