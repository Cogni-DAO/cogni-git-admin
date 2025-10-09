# Source Code Structure

## Current Status: Files Moved to Clean Architecture

### `index.ts` - Main Application Entry Point  
- **Purpose**: Probot application with dual webhook handlers
- **Dependencies**: Now imports from `utils/hmac` and `services/rpc`
- **Status**: Updated imports, functionality unchanged

### `core/signal/parser.ts` - CogniAction Event Parser (moved from `cogni.ts`)
- **Purpose**: Pure domain logic for CogniAction event parsing
- **Key Exports**:
  - `abi`: ParseAbi for CogniAction event signature  
  - `COGNI_TOPIC0`: Event topic hash constant
  - `tryParseCogniLog()`: Decodes event log data into structured object
- **Layer**: Core domain logic (no external dependencies)

### `services/rpc.ts` - Blockchain RPC Client (moved from `rpc.ts`)
- **Purpose**: External RPC service integration with Viem
- **Key Exports**:
  - `client`: PublicClient configured for Sepolia testnet
  - `fetchCogniFromTx()`: Fetches transaction receipt and parses CogniAction events
- **Layer**: Services layer (external system integration)

### `utils/hmac.ts` - HMAC Utilities (moved from `mw.ts`)
- **Purpose**: Stateless helper functions for webhook processing
- **Key Exports**:
  - `rawJson()`: Express middleware for JSON parsing with raw body access
  - `verifyAlchemyHmac()`: HMAC signature verification
- **Layer**: Utilities (stateless helpers)

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