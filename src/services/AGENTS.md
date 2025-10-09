# External Services

## Purpose
Integration with external systems (blockchain, GitHub, logging, etc.).

## Scope
- RPC client management
- GitHub API integration
- Logging services
- External API calls and responses

## Current Implementation
- **rpc.ts**: Blockchain RPC client using Viem for Sepolia
- **github.ts**: GitHub API integration using Probot's authenticated Octokit
- **logging.ts**: Not implemented (using Probot's built-in logger)

## Structure
- `rpc.ts` - Blockchain RPC client (Viem) for fetching CogniAction events
- `github.ts` - GitHub service with `mergePR()` using Probot installation tokens
- `logging.ts` - Planned: Structured logging service

## GitHub Service Details
- **Authentication**: Uses Probot app's `app.auth(installationId)` 
- **Installation Mapping**: `core/auth/github.ts` maps DAO+repo to installation ID
- **API Format**: `await octokit.request({ method: "PUT", url: "/repos/...", ... })`
- **Current Issue**: GitHub App needs pull request write permissions (403 error)

## Guidelines
- Handle external system failures gracefully
- Implement retry logic where appropriate
- Abstract external APIs behind service interfaces
- Provide clear error messages