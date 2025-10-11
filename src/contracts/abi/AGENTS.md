# Contract ABIs

## Purpose
Reference ABI files for blockchain contract interaction during E2E testing.

## Structure
- `CogniSignal.json` - CogniSignal contract ABI (signal function + CogniAction event)
- `AdminPlugin.json` - Aragon Admin Plugin ABI (createProposal function)

## Usage
These ABIs are referenced by:
- `e2e/tests/blockchain-integration.spec.ts` - For blockchain integration tests
- Future blockchain client implementations

## Source
ABIs extracted from deployed contracts on Sepolia testnet for E2E test compatibility.