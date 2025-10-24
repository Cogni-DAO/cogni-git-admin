# Contract ABIs

## Purpose
Reference ABI files for blockchain contract interaction during E2E testing.

## Structure
- `CogniSignal.json` - CogniSignal contract ABI with updated schema (5-parameter signal function + CogniAction event)
- `AdminPlugin.json` - Aragon Admin Plugin ABI (createProposal function)

## CogniSignal Schema
Current CogniSignal contract uses updated 5-parameter schema:
```solidity
signal(string repoUrl, string action, string target, string resource, bytes extra)
CogniAction(address dao, uint256 chainId, string repoUrl, string action, string target, string resource, bytes extra, address executor)
```

## Usage
These ABIs are referenced by:
- `e2e/tests/blockchain-pr-merge.spec.ts` - PR merge workflow tests
- `e2e/tests/blockchain-admin-management.spec.ts` - Admin management workflow tests
- `src/core/signal/parser.ts` - Event parsing with updated schema
- Future blockchain client implementations

## Source
ABIs extracted from deployed contracts on Sepolia testnet for E2E test compatibility.