# Source Code Structure

## Files Overview

### `index.ts` - Main Application Entry Point
- **Purpose**: Probot application with dual webhook handlers
- **GitHub**: Standard Probot events (issues.opened, installation.created)
- **Alchemy**: Custom route `/alchemy/cogni` for blockchain webhooks
- **Dependencies**: Uses middleware from `mw.ts` and RPC client from `rpc.ts`

### `cogni.ts` - CogniAction Event Parser
- **Purpose**: Ethereum event parsing utilities
- **Key Exports**:
  - `abi`: ParseAbi for CogniAction event signature
  - `COGNI_TOPIC0`: Event topic hash constant
  - `tryParseCogniLog()`: Decodes event log data into structured object
- **Event Structure**: `(dao, chainId, repo, action, target, pr, commit, extra, executor)`

### `rpc.ts` - Blockchain RPC Client
- **Purpose**: Viem-based Ethereum client for Sepolia
- **Key Exports**:
  - `client`: PublicClient configured for Sepolia testnet
  - `fetchCogniFromTx()`: Fetches transaction receipt and parses CogniAction events
- **Flow**: txHash → getTransactionReceipt → filter logs by contract address → parse events

### `mw.ts` - Express Middleware
- **Purpose**: HTTP request processing utilities
- **Key Exports**:
  - `rawJson()`: Express middleware for JSON parsing with raw body access
  - `verifyAlchemyHmac()`: HMAC signature verification for Alchemy webhooks
- **Security**: Optional HMAC verification using `ALCHEMY_SIGNING_KEY`

## Data Flow
```
Alchemy → Express middleware → txHash extraction → RPC call → 
event parsing → validation → structured logging
```

## Key Patterns
- TypeScript with Viem for type-safe blockchain interactions
- Express router mounted on Probot app for custom endpoints  
- Environment variable validation at runtime
- Error handling with appropriate HTTP status codes (400, 401, 204, 500)
- BigInt serialization handling for JSON logging