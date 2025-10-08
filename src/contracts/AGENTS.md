# Smart Contract Interfaces

## Purpose
Contract ABI definitions and type-safe interfaces for blockchain interactions.

## Scope
- Contract ABI JSON files
- Type definitions for contract events
- Contract address constants

## Current Implementation
- **CogniAction ABI**: Defined in `core/signal/parser.ts` using Viem's parseAbi
- **Contract Constants**: Topic hash and addresses managed in parser module
- **No separate ABI files**: Using inline definitions for MVP

## Structure
- `abi/` - JSON ABI files for contracts (empty, reserved for future)
- **Current approach**: ABI definitions in respective domain modules

## Guidelines
- Keep ABI files in sync with deployed contracts
- Generate types from ABI where possible
- Document contract addresses and deployment info