# Smart Contract Interfaces

## Purpose
Contract ABI definitions and type-safe interfaces for blockchain interactions.

## Scope
- Contract ABI JSON files
- Type definitions for contract events
- Contract address constants

## Current Implementation
- **Empty**: ABI constants exist inline in `src/cogni.ts`
- **Planned**: Extracted ABI files and type definitions

## Structure
- `abi/` - JSON ABI files for contracts
  - `CogniSignal.json` - CogniAction event ABI

## Guidelines
- Keep ABI files in sync with deployed contracts
- Generate types from ABI where possible
- Document contract addresses and deployment info