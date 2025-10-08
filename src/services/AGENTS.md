# External Services

## Purpose
Integration with external systems (blockchain, GitHub, logging, etc.).

## Scope
- RPC client management
- GitHub API integration
- Logging services
- External API calls and responses

## Current Implementation
- **Partial**: RPC client exists in `src/rpc.ts`, needs to be moved here
- **Planned**: GitHub service, logging service

## Structure
- `rpc.ts` - Blockchain RPC client (Viem)
- `github.ts` - GitHub API integration (Octokit)
- `logging.ts` - Structured logging service

## Guidelines
- Handle external system failures gracefully
- Implement retry logic where appropriate
- Abstract external APIs behind service interfaces
- Provide clear error messages