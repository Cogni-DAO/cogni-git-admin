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
```

## Development
```bash
npm run dev    # Start with nodemon
npm run build  # Compile TypeScript
```

## Next Refactoring Steps
1. Move existing logic to new directory structure
2. Extract provider adapter for Alchemy
3. Implement central routing with version prefix
4. Add health check endpoint