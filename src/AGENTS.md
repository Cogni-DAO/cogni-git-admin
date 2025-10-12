# Source Code Structure

## Architecture Overview
Clean architecture with separation of concerns: API handlers, core domain logic, external services, and utilities.

## Key Components

### Entry Points
- **`index.ts`**: Probot application bootstrap with route mounting
- **`routes.ts`**: Central route registration for versioned API

### API Layer (`api/`)
- **`health/`**: Health check endpoints
- **`webhooks/github/`**: GitHub webhook processing via Probot
- **`webhooks/onchain/cogni-signal/`**: Blockchain event webhook handler with provider adapter pattern

### Core Domain (`core/`)
- **`signal/`**: CogniAction event parsing and validation
  - `parser.ts`: ABI decoding and event parsing
  - `schema.ts`: Zod validation schemas
- **`action_execution/`**: Extensible action execution system
  - `types.ts`: Core interfaces (ActionHandler, ValidationResult, ActionResult)
  - `registry.ts`: Action registration and lookup
  - `executor.ts`: Orchestrates action validation and execution
  - `actions/`: Individual action handlers (merge-pr, add-admin)
- **`auth/`**: Authentication helpers (GitHub installation mapping)

### Services Layer (`services/`)
- **`rpc.ts`**: Blockchain RPC client using Viem
- **`github.ts`**: GitHub API operations (mergePR, addAdmin)
- **`logging.ts`**: Structured logging (planned)

### Providers (`providers/onchain/`)
- **`alchemy.ts`**: Alchemy webhook adapter
- **`detect.ts`**: Provider detection logic
- **`registry.ts`**: Provider adapter registry

### Utilities (`utils/`)
- **`env.ts`**: Environment variable validation
- **`hmac.ts`**: HMAC signature verification
- **`idempotency.ts`**: Deduplication logic

## Data Flow
Webhook → Provider Detection → Adapter Verification → Transaction Extraction → RPC Fetch → Event Parsing → Validation → Action Registry → Handler Execution → GitHub API → Response

## Key Patterns
- **Registry Pattern**: Extensible action handlers and provider adapters
- **Clean Architecture**: Separation of API, domain, services layers
- **Type Safety**: TypeScript with Viem for blockchain interactions
- **Provider Agnostic**: Adapter pattern for multiple webhook providers
- **Versioned API**: `/api/v1/*` namespace for future compatibility
- **Audit Trail**: Executor identity logged for all actions