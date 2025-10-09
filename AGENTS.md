# Cogni Git Admin

## Overview
Blockchain-to-GitHub bridge that processes CogniSignal events from onchain webhooks into GitHub operations. Built as a versioned API with provider adapters and clean architecture separation.

## Architecture
- **Versioned API**: `/api/v1/*` endpoints for webhooks and health checks
- **Provider Adapters**: Normalize different webhook providers (currently Alchemy hardcoded)
- **Clean Layers**: API → Core domain logic → Services (RPC, GitHub)
- **Probot Integration**: GitHub webhook handling via standard Probot patterns

## Current Endpoints
- `POST /api/v1/webhooks/onchain/cogni-signal` - CogniSignal events from any provider
- `POST /api/v1/webhooks/github` - GitHub repository webhooks (Probot)
- `GET /api/v1/health` - Application health check

## Code Structure (Scaffolding - Many Empty)
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
├─ core/signal/                  # Pure domain logic
│  ├─ parser.ts                  # CogniAction ABI decoding
│  └─ schema.ts                  # Zod validation schemas
├─ services/                     # External system integrations
│  ├─ rpc.ts                     # Blockchain RPC client
│  ├─ github.ts                  # GitHub API client
│  └─ logging.ts                 # Structured logging
├─ utils/                        # Stateless helpers
│  ├─ env.ts                     # Environment validation
│  ├─ hmac.ts                    # Signature verification
│  └─ idempotency.ts             # Deduplication logic
└─ contracts/abi/                # Contract ABIs
   └─ CogniSignal.json           # Event definitions

tools/dev/webhook-capture/       # Webhook fixture capture system
├─ capture-server.ts             # HTTP server for capturing webhooks
└─ lib/fixture-writer.ts         # Fixture persistence logic

test/
├─ fixtures/                     # Captured webhook fixtures
│  ├─ alchemy/                   # Alchemy webhook fixtures
│  └─ github/                    # GitHub webhook fixtures  
└─ helpers/fixture-replay.ts     # Replay fixtures for testing

e2e/
└─ webhook-e2e.test.ts           # MVP smoke test for webhook processing
```

## Current Implementation Status
- **Working**: Webhook reception, CogniAction parsing, validation (hardcoded to Alchemy)
- **Scaffolding**: Directory structure and AGENTS.md documentation
- **Empty**: Most new directories, provider adapters, health checks

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
E2E_APP_DEPLOYMENT_URL=<deployment_url>  # Target deployment for E2E tests
TEST_REPO_GITHUB_PAT=<github_token>      # Optional: verify GitHub API effects

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
npm run test:e2e   # Run E2E tests against deployment (requires E2E_APP_DEPLOYMENT_URL)

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
4. Fixtures saved to `fixtures/<provider>/<event>/`
5. Use `test/helpers/fixture-replay.ts` to replay in tests

## Technical Debt
- **Probot v7 Legacy**: Current build uses CJS adapter (`lib/entry.cjs`) to bridge ESM source with legacy Probot v7 
  - **Work Item**: `3ec4c3ea-dd9c-4597-a96e-a0d69c626b80` - Upgrade to Probot v12+ for native ES module support
  - **Impact**: Eliminates dual module system complexity, enables modern build process

- **E2E Test MVP Status**: Current E2E test (`e2e/webhook-e2e.test.ts`) provides only basic smoke testing
  - **Limitations**: HTTP 200 validation only, no GitHub API verification, no error scenarios
  - **Required**: Production-ready E2E testing with comprehensive validation

- **Smee Client Environment Variables**: Known issue with environment variable parsing in Smee proxy commands
  - **Impact**: Environment variables not correctly passed to capture server
  - **Workaround**: Hardcode values or use alternative proxy methods

## Next Refactoring Steps
1. Move existing logic to new directory structure
2. Extract provider adapter for Alchemy
3. Implement central routing with version prefix
4. Add health check endpoint