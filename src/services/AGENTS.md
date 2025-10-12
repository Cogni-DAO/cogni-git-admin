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
- **github.ts**: GitHub API integration with repository management operations
  - `mergePR()`: Merges pull requests with bypass capabilities
  - `addAdmin()`: Adds users as repository administrators
- **logging.ts**: Not implemented (using Probot's built-in logger)

## Structure
- `rpc.ts` - Blockchain RPC client (Viem) for fetching CogniAction events
- `github.ts` - GitHub repository operations:
  - `mergePR(octokit, repo, prNumber, executor)` - Merge pull request
  - `addAdmin(octokit, repo, username, executor)` - Add repository admin
- `logging.ts` - Planned: Structured logging service

## GitHub Service Details

### Authentication
- Uses Probot app's `app.auth(installationId)` for repository-scoped tokens
- Installation mapping in `core/auth/github.ts` (environment-aware)

### Operations

#### `mergePR(octokit, repo, prNumber, executor)`
- **Endpoint**: `PUT /repos/{owner}/{repo}/pulls/{prNumber}/merge`
- **Permissions Required**: `pull_requests: write`, `contents: write`
- **Parameters**: Repository path, PR number, executor identity
- **Returns**: Success with SHA or failure with error details

#### `addAdmin(octokit, repo, username, executor)`  
- **Endpoint**: `PUT /repos/{owner}/{repo}/collaborators/{username}`
- **Permissions Required**: `administration: write`
- **Parameters**: Repository path, GitHub username, executor identity
- **Validation**: Username format and non-empty checks
- **Returns**: Success with status or failure with error details

## Guidelines
- Handle external system failures gracefully
- Implement retry logic where appropriate
- Abstract external APIs behind service interfaces
- Provide clear error messages