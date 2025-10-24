# External Services

## Purpose
Integration with external systems (blockchain, GitHub, logging, etc.).

**Design Principle**: Service functions provide atomic 1:1 mappings to external API calls. Each function should map to exactly one external API endpoint. Complex business logic and orchestration should be handled in action handlers or core domain logic, not in services.

## Scope
- RPC client management
- GitHub API integration
- Logging services
- External API calls and responses

## Current Implementation
- **rpc.ts**: Blockchain RPC client using Viem, configured via `environment.EVM_RPC_URL` from typed environment object
- **github.ts**: GitHub API integration with repository management operations
- **logging.ts**: Not implemented (using Probot's built-in logger)

## Structure
- `rpc.ts` - Blockchain RPC client (Viem) for fetching CogniAction events
- `github.ts` - GitHub repository operations:
  - `mergePR(octokit, repo, prNumber, executor)` - Merge pull request
  - `addAdmin(octokit, repo, username, executor)` - Add repository admin
  - `removeCollaborator(octokit, repo, username)` - Remove repository collaborator
  - `listInvitations(octokit, repo)` - List pending repository invitations
  - `cancelInvitation(octokit, repo, invitationId)` - Cancel repository invitation
- `logging.ts` - Planned: Structured logging service

## GitHub Service Details

### Authentication
- Uses authenticated Octokit instances provided by VCS factory pattern
- Token management handled at VCS provider level, not in service functions

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

#### `removeCollaborator(octokit, repo, username)`  
- **Endpoint**: `DELETE /repos/{owner}/{repo}/collaborators/{username}`
- **Permissions Required**: `administration: write`
- **Parameters**: Repository path, GitHub username
- **Validation**: Username format and non-empty checks
- **Returns**: Success with status or failure with error details

#### `listInvitations(octokit, repo)`  
- **Endpoint**: `GET /repos/{owner}/{repo}/invitations`
- **Permissions Required**: `administration: read`
- **Parameters**: Repository path
- **Returns**: Success with invitations array or failure with error details

#### `cancelInvitation(octokit, repo, invitationId)`  
- **Endpoint**: `DELETE /repos/{owner}/{repo}/invitations/{invitation_id}`
- **Permissions Required**: `administration: write`
- **Parameters**: Repository path, invitation ID
- **Validation**: Invitation ID must be positive number
- **Returns**: Success with status or failure with error details

## Guidelines
- Handle external system failures gracefully
- Implement retry logic where appropriate
- Abstract external APIs behind service interfaces
- Provide clear error messages
- Keep service functions atomic - one external API call per function