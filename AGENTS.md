# Cogni Git Admin

## Overview
Blockchain-to-GitHub bridge that processes CogniSignal events from onchain webhooks into GitHub operations. Built as a versioned API with provider adapters and clean architecture separation.

## Deployment
- Build phase compilation prevents runtime OOM during GitHub app startup
- Reliable webhook processing for DAO-driven repository operations

## Architecture
- **Versioned API**: `/api/v1/*` endpoints for webhooks and health checks
- **Provider Adapters**: Normalize different webhook providers (currently Alchemy hardcoded)
- **Clean Layers**: API → Core domain logic → Services (RPC, GitHub)
- **Probot Integration**: GitHub webhook handling via standard Probot patterns

## Project Management
- **Cogni MCP Epic**: All work items must accrue up to this parent Epic for cogni-git-admin: `0b132be5-4692-4266-9e30-10acf9e1f1ca`

## Current Endpoints
- `POST /api/v1/webhooks/onchain/cogni-signal` - CogniSignal events from any provider
- `POST /api/v1/webhooks/github` - GitHub repository webhooks (Probot)
- `GET /api/v1/health` - Application health check

## Code Structure
```
src/
├─ index.ts                      # Boot Probot, mount API routes
├─ routes.ts                     # Central route registration
├─ api/                          # HTTP layer (thin handlers)
│  ├─ health/                    # Health check endpoints
│  └─ webhooks/
│     ├─ github/                 # GitHub webhook routes
│     └─ onchain/cogni-signal/   # CogniSignal webhook routes
├─ providers/onchain/            # Webhook provider adapters
│  ├─ alchemy.ts                 # Alchemy payload parser (MVP)
│  ├─ detect.ts                  # Provider detection
│  └─ (future: quicknode.ts)     # Other providers
├─ core/                         # Pure domain logic
│  ├─ signal/                    # Signal parsing (minimal surface area)
│  │  ├─ signal.ts               # Signal types, RepoRef parser, logging utils
│  │  └─ parser.ts               # parseCogniAction() - only knows raw ABI
│  ├─ action_execution/          # Signal + Context execution pattern
│  │  ├─ types.ts                # ActionHandler with run(signal, ctx)
│  │  ├─ context.ts              # ExecContext with resolved auth/repo
│  │  ├─ registry.ts             # Action registration (action:target keys)
│  │  ├─ executor.ts             # Builds context, routes to handlers
│  │  └─ actions/                # Action handlers
│  │     ├─ merge-pr.ts          # merge:change
│  │     ├─ add-admin.ts         # grant:collaborator
│  │     └─ remove-admin.ts      # revoke:collaborator
│  └─ auth/                      # Authentication helpers
│     └─ github.ts               # Installation ID mapping
├─ services/                     # External system integrations
│  ├─ rpc.ts                     # Blockchain RPC client
│  ├─ github.ts                  # GitHub API operations
│  └─ logging.ts                 # Structured logging (planned)
├─ utils/                        # Stateless helpers
│  ├─ env.ts                     # Two-tier environment validation (base/dev with conditional requirements)
│  ├─ hmac.ts                    # Signature verification
│  └─ idempotency.ts             # Deduplication logic
└─ contracts/                    # Smart contract interfaces
   └─ abi/                       # Contract ABI JSON files
      ├─ CogniSignal.json        # CogniSignal contract ABI
      └─ AdminPlugin.json        # Aragon Admin Plugin ABI

tools/dev/webhook-capture/       # Webhook fixture capture system
├─ capture-server.ts             # HTTP server for capturing webhooks
└─ lib/fixture-writer.ts         # Fixture persistence logic

test/
├─ fixtures/                     # Captured webhook fixtures
│  ├─ alchemy/                   # Alchemy webhook fixtures
│  └─ github/                    # GitHub webhook fixtures
├─ unit/                         # Unit tests for core logic
│  ├─ add-admin-simple.test.ts   # ADD_ADMIN action tests
│  ├─ merge-pr-action.test.ts    # PR_APPROVE action tests
│  └─ registry.test.ts           # Action registry tests
├─ helpers/fixture-replay.ts     # Replay fixtures for testing
└─ index.test.ts                 # Main application tests

e2e/
├─ tests/
│  ├─ fixture-replay.spec.ts    # Webhook fixture replay tests
│  └─ blockchain-integration.spec.ts # Live blockchain E2E tests
├─ helpers/                      # Test utilities and setup
└─ AGENTS_E2E_MVP.md            # E2E workflow specification
```

## Current Implementation
- **Signal Architecture**: Minimal surface area design where only `parser.ts` knows raw blockchain structure
- **Webhook Processing**: Alchemy provider → `parseCogniAction()` → `Signal` → `executeAction(signal, ctx)`
- **Action Execution**: Registry routes `action:target` to handlers with `run(signal, ctx)` signature
  - `merge:change`: PR merge with bypass capabilities
  - `grant:collaborator`: Add repository administrators  
  - `revoke:collaborator`: Remove administrators or cancel invitations
- **Context Pattern**: `ExecContext` provides resolved repo info, auth, logging to handlers
- **HTTP Response Codes**: Returns 200 for success, 400 for unknown providers, 401 for signature failures, 422 for validation errors, 204 for no relevant events
- **Testing**: Comprehensive test coverage with Jest unit tests and Playwright E2E tests
  - **Unit Tests**: Core action logic and registry functionality with mocked dependencies
  - **E2E Tests**: Playwright-based test suite with fixture replay and live blockchain integration tests
- **Contract Integration**: ABI definitions for CogniSignal and AdminPlugin contracts stored in src/contracts/abi/
- **GitHub Integration**: Probot-based GitHub App with repository management capabilities
- **Code Quality**: ESLint with TypeScript type checking and automatic import sorting enforced

## Environment Variables

The application uses a two-tier validation system in `src/utils/env.ts` that validates environment variables on startup. The validation runs when `src/index.ts` imports the module, failing fast with clear error messages if required variables are missing or invalid:

### Base Requirements (Production/Development)
```bash
# Runtime Configuration
NODE_ENV=development                   # development|test|production
APP_ENV=dev                           # dev|preview|prod  
PORT=3000                             # Server port
LOG_LEVEL=info                        # trace|debug|info|warn|error|fatal

# GitHub App Configuration (required in production, optional in dev/test)
APP_ID=<app_id>                      # GitHub App ID
PRIVATE_KEY=<private_key>            # GitHub App private key (PEM format, handled by Probot)
WEBHOOK_SECRET=<secret>              # GitHub webhook verification secret

# Blockchain Configuration (required in production, optional in dev/test)
CHAIN_ID=11155111                     # Chain ID (e.g., 11155111 for Sepolia)
SIGNAL_CONTRACT=0x<address>          # CogniSignal contract address
DAO_ADDRESS=0x<address>              # DAO contract address
EVM_RPC_URL=https://...              # Ethereum RPC endpoint

# Webhook Verification (required in production, optional in dev/test)
ALCHEMY_SIGNING_KEY=<key>            # Alchemy webhook HMAC key
```

### Development Options
```bash
# Optional development tools
WEBHOOK_PROXY_URL=<smee_url>        # Smee proxy for GitHub webhooks
ALCHEMY_PROXY_URL=<smee_url>        # Smee proxy for Alchemy webhooks  
CAPTURE_PORT=4001                    # Webhook capture server port
FIXTURE_CAPTURE_DIR=./test/fixtures  # Fixture storage directory

# GitHub OAuth (dev-only, not used in production)
GITHUB_CLIENT_ID=<client_id>         # GitHub OAuth client ID
GITHUB_CLIENT_SECRET=<client_secret> # GitHub OAuth client secret
```

### E2E Testing Requirements
Activated when `NODE_ENV=test` or `E2E_ENABLED=1`:
```bash
# Infrastructure Targets
E2E_APP_DEPLOYMENT_URL=<url>         # Target deployment URL
E2E_TEST_REPO=<owner/repo>           # GitHub repository for testing
E2E_TEST_REPO_GITHUB_PAT=<token>     # GitHub PAT with repo permissions

# Blockchain Test Configuration
ARAGON_ADMIN_PLUGIN_CONTRACT=0x<address>  # Aragon Admin Plugin address
WALLET_PRIVATE_KEY=<key>             # Test wallet private key

# Test Timing Configuration
E2E_WEBHOOK_TIMEOUT_MS=120000        # Webhook processing timeout
E2E_POLL_INTERVAL_MS=5000            # Status check interval
E2E_TEST_ADMIN_USERNAME=cogni-test-user  # Test admin username
```

## AragonOSxProvider Integration (October 2025)

### 🎉 Plug-and-Play Setup with cogni-gov-contracts

The `cogni-gov-contracts` repository's AragonOSxProvider script generates **100% compatible** environment variables for cogni-git-admin e2e tests.

#### Quick Setup Process

1. **Deploy DAO** (in cogni-gov-contracts):
   ```bash
   cd /path/to/cogni-gov-contracts
   # Deploy DAO with AragonOSxProvider
   forge script script/SetupDevChain.s.sol --rpc-url $EVM_RPC_URL --broadcast
   ```

2. **Copy Generated Variables** (generated at `cogni-gov-contracts/script/.env.TOKEN`):
   ```bash
   # Copy/paste these variables directly into cogni-git-admin/.env:
   WALLET_PRIVATE_KEY=0x...
   EVM_RPC_URL=https://...
   SIGNAL_CONTRACT=0x...
   DAO_ADDRESS=0x...
   ARAGON_ADMIN_PLUGIN_CONTRACT=0x...
   CHAIN_ID=11155111
   ```

3. **Run E2E Tests**:
   ```bash
   cd /path/to/cogni-git-admin
   npm run e2e:blockchain  # Should pass immediately
   ```

#### Key Features

- **✅ Dynamic DAO Mapping**: GitHub installation automatically uses `environment.DAO_ADDRESS` 
- **✅ Real Aragon Contracts**: Uses official Aragon OSx DAO with Admin Plugin v1.2
- **✅ Complete Workflow**: DAO vote → blockchain event → webhook → GitHub action
- **✅ Zero Manual Configuration**: All addresses generated and mapped automatically

#### Current Limitations

⚠️ **This is a brittle proof of concept**:

- **Single Wallet**: Same wallet deploys AND executes all DAO operations (not true governance)
- **Hardcoded Repository**: Only works with `derekg1729/test-repo`
- **Immediate Execution**: Admin Plugin configured for instant execution (no voting period)
- **Environment-Specific**: Requires manual GitHub App installation management

## Development
```bash
npm run dev        # Start with nodemon
npm run build      # Compile TypeScript
npm test           # Run Jest unit tests
npm run e2e              # Run all Playwright E2E tests
npm run e2e:fixtures      # Fast fixture replay tests only
npm run e2e:blockchain    # Blockchain integration tests only
npm run validate-e2e-setup  # Validate all E2E prerequisites (wallet, contracts, GitHub, webhooks)

# Webhook Fixture Capture
npm run dev:capture              # Start capture server on port 4001
npm run smee-capture-chain-events # Route Alchemy webhooks to capture
npm run smee-capture-git-events   # Route GitHub webhooks to capture
npm run capture                   # Run both Smee clients concurrently
```

### Webhook Testing Workflow
1. Start capture server: `npm run dev:capture`
2. Route webhooks through Smee to capture: `npm run capture`  
3. Trigger webhooks (GitHub actions, blockchain events)
4. Fixtures saved to `test/fixtures/<provider>/<event>/`
5. Use `e2e/helpers/fixture-replay.ts` to replay in tests

## Technical Debt
- **Probot v7 Legacy**: Current build uses CJS adapter (`lib/entry.cjs`) to bridge ESM source with legacy Probot v7
  - Blocks native ES module support and modern build patterns

- **GitHub App Installation IDs**: Hardcoded mapping between environments (dev: 89056469, production: 89353955)
  - Requires database-backed installation mapping for scalability