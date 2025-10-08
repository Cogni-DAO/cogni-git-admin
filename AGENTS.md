# Cogni Git Admin

## Overview
Blockchain-to-GitHub bridge that receives Alchemy webhooks for CogniAction events and processes them into GitHub operations. Built as a Probot TypeScript application running dual webhook handlers.

## Architecture
- **Probot**: Handles GitHub webhooks (installation, issues, etc.)
- **Alchemy Webhook**: Custom Express endpoint at `/alchemy/cogni` for blockchain events
- **Viem**: Ethereum client for Sepolia testnet RPC calls
- **Event Processing**: Parses CogniAction events from transaction logs

## Workflow
1. Alchemy webhook → `/alchemy/cogni` with transaction data
2. Extract txHash from `body.event.data.block.logs[].transaction.hash`
3. RPC call via Viem to fetch full transaction receipt
4. Parse logs for CogniAction events from COGNI_SIGNAL_CONTRACT
5. Validate chainId and DAO address
6. Log structured payload for GitHub action processing

## Environment Variables
```bash
# Required
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<key>
COGNI_CHAIN_ID=11155111
COGNI_SIGNAL_CONTRACT=0x<contract_address>
COGNI_ALLOWED_DAO=0x<dao_address>
COGNI_ALLOWED_REPO=owner/repo

# Optional
ALCHEMY_SIGNING_KEY=<hmac_key>
```

## Current State
MVP complete: Successfully receives webhooks, parses CogniAction events, validates chain/DAO, logs structured data. Ready for GitHub action integration.

## Example CogniAction Log
```
kind=CogniAction, dao=0xa38..., chainId=11155111, repo=Cogni-DAO/cogni-git-review, 
action=PR_APPROVE, target=pull_request, pr=112, executor=0xa38...
```

## Development
```bash
npm run dev    # Start with nodemon
npm run build  # Compile TypeScript
```

## Next Steps
- Map actions (PR_APPROVE, PR_MERGE, etc.) to GitHub Octokit operations
- Add idempotency tracking
- Implement Zod schema validation