# Smart Contract Interfaces

## Purpose
Contract ABI definitions and type-safe interfaces for blockchain interactions.

## Scope
- Contract ABI JSON files
- Type definitions for contract events
- Contract address constants

## Current Implementation
- **CogniSignal ABI**: Available in `abi/CogniSignal.json` and inline in test files using Viem's parseAbi
- **AdminPlugin ABI**: Available in `abi/AdminPlugin.json` for Aragon Admin Plugin interactions
- **Contract Constants**: Topic hash and addresses managed in parser module
- **Dual approach**: JSON ABI files for tooling + inline definitions for runtime

## Structure
- `abi/CogniSignal.json` - CogniSignal contract ABI with signal() function and CogniAction event
- `abi/AdminPlugin.json` - Aragon Admin Plugin ABI for DAO proposal execution
- **Runtime usage**: Inline parseAbi() definitions in blockchain integration tests and core modules

## Guidelines
- Keep ABI files in sync with deployed contracts
- Generate types from ABI where possible
- Document contract addresses and deployment info