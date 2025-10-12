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
│  ├─ signal/                    # CogniAction parsing
│  │  ├─ parser.ts               # ABI decoding and validation
│  │  └─ schema.ts               # Zod validation schemas
│  ├─ action_execution/          # Extensible action system
│  │  ├─ types.ts                # Core interfaces
│  │  ├─ registry.ts             # Action registration
│  │  ├─ executor.ts             # Execution orchestrator
│  │  └─ actions/                # Action handlers
│  │     ├─ merge-pr.ts          # PR_APPROVE handler
│  │     └─ add-admin.ts         # ADD_ADMIN handler
│  └─ auth/                      # Authentication helpers
│     └─ github.ts               # Installation ID mapping
├─ services/                     # External system integrations
│  ├─ rpc.ts                     # Blockchain RPC client
│  ├─ github.ts                  # GitHub API operations
│  └─ logging.ts                 # Structured logging (planned)
├─ utils/                        # Stateless helpers
│  ├─ env.ts                     # Environment validation
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
- **Webhook Processing**: Receives and validates CogniSignal events from Alchemy provider, parses CogniAction events, executes GitHub operations
- **Action Execution**: Extensible registry-based system supporting multiple action types
  - `PR_APPROVE`: Merges pull requests with bypass capabilities
  - `ADD_ADMIN`: Adds users as repository administrators
- **HTTP Response Codes**: Returns 200 for success, 400 for unknown providers, 401 for signature failures, 422 for validation errors, 204 for no relevant events
- **Testing**: Comprehensive test coverage with Jest unit tests and Playwright E2E tests
  - **Unit Tests**: Core action logic (ADD_ADMIN, PR_APPROVE) and registry functionality with mocked dependencies
  - **E2E Tests**: Playwright-based test suite with fixture replay and live blockchain integration tests
- **Contract Integration**: ABI definitions for CogniSignal and AdminPlugin contracts stored in src/contracts/abi/
- **GitHub Integration**: Probot-based GitHub App with repository management capabilities

## Environment Variables
```bash
# Required
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<key>
COGNI_CHAIN_ID=11155111
COGNI_SIGNAL_CONTRACT=0x<contract_address>
COGNI_ALLOWED_DAO=0x<dao_address>
COGNI_ALLOWED_REPO=owner/repo

# Optional (provider-specific)
ALCHEMY_SIGNING_KEY=<hmac_key>

# E2E Testing
# See e2e/AGENTS.md for complete environment variable reference
E2E_APP_DEPLOYMENT_URL=<deployment_url>       # Target deployment for E2E tests
E2E_TEST_REPO_GITHUB_PAT=<github_token>       # GitHub PAT for API operations
E2E_SEPOLIA_RPC_URL=<rpc_endpoint>            # Sepolia RPC for blockchain tests
E2E_TEST_WALLET_PRIVATE_KEY=<private_key>     # Test wallet for transactions
E2E_TEST_REPO=<owner/repo>                    # Target test repository

# Webhook Capture (development)
CAPTURE_PORT=4001                      # Capture server port
FIXTURE_CAPTURE_DIR=./fixtures         # Fixture storage directory
ALCHEMY_PROXY_URL=<smee_url>          # Smee proxy for Alchemy webhooks
WEBHOOK_PROXY_URL=<smee_url>          # Smee proxy for GitHub webhooks
```

## Development
```bash
npm run dev        # Start with nodemon
npm run build      # Compile TypeScript
npm test           # Run Jest unit tests
npm run e2e        # Run Playwright E2E tests (uses dotenv for environment variables)
npm run e2e -- --project=fixture-replay        # Fast fixture tests only
npm run e2e -- --project=blockchain-integration # Blockchain integration tests
npm run e2e -- --project=admin-management      # Admin management workflow tests
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
  - **Work Item**: `3ec4c3ea-dd9c-4597-a96e-a0d69c626b80` - Upgrade to Probot v12+ for native ES module support
  - **Impact**: Eliminates dual module system complexity, enables modern build process

- **GitHub App Installation IDs**: Hardcoded mapping between environments (dev: 89056469, production: 89353955)
  - **Impact**: Temporary solution requiring code changes for new installations
  - **Required**: Database-backed installation mapping

- **Smee Client Environment Variables**: Known issue with environment variable parsing in Smee proxy commands
  - **Impact**: Environment variables not correctly passed to capture server
  - **Workaround**: Hardcode values or use alternative proxy methods

## Next Refactoring Steps
1. Move existing logic to new directory structure
2. Extract provider adapter for Alchemy
3. Implement central routing with version prefix
4. Add health check endpoint