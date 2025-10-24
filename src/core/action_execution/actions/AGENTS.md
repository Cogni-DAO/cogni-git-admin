# Action Handlers

## Purpose
Individual action handler implementations for the extensible action registry system. Each handler provides validation and execution logic for specific blockchain-initiated GitHub operations.

## Scope
- Individual action handler implementations
- Action-specific validation logic
- GitHub API operation execution
- Structured result handling

## Current Implementations

### merge-pr.ts - Merge Handler
- **Action**: `merge:change`
- **Purpose**: Merge pull requests via DAO vote with bypass capabilities
- **Validation**: Validates PR number > 0 and parses repository from repoUrl
- **Execution**: Merges pull request using GitHub API with bypass permissions
- **Schema**: Uses `resource` field for PR number (string), parses repo from `repoUrl`
- **Returns**: Success with SHA or failure with error details

### add-admin.ts - Grant Collaborator Handler  
- **Action**: `grant:collaborator`
- **Purpose**: Add users as repository administrators via DAO vote
- **Validation**: Validates repository format and extracts username from resource field
- **Execution**: Adds user as repository collaborator with admin permissions
- **Schema**: Uses `resource` field for username directly (no hex decoding)
- **Returns**: Success with user details or failure with error details

### remove-admin.ts - Revoke Collaborator Handler
- **Action**: `revoke:collaborator`
- **Purpose**: Remove users as repository administrators via DAO vote
- **Validation**: Validates repository format and extracts username from resource field
- **Execution**: Removes active collaborator or cancels pending invitation
- **Schema**: Uses `resource` field for username directly (no hex decoding)
- **Returns**: Success with user details and operation flags (`collaboratorRemoved`, `invitationCancelled`) or failure with error details

## Handler Interface
All handlers implement the `ActionHandler` interface:
```typescript
interface ActionHandler {
  readonly action: string;        // Action name (e.g., "merge")
  readonly target: string;        // Target type (e.g., "change")
  readonly description: string;   // Human readable description
  
  validate(parsed: CogniActionParsed): Promise<ValidationResult>;
  execute(parsed: CogniActionParsed, octokit: Octokit, logger: Application['log']): Promise<ActionResult>;
}
```

## Updated Schema Support
All handlers use the new CogniSignal schema with:
- `repoUrl` field (full GitHub URL) instead of `repo` field
- `resource` field for action-specific data (PR number, username) instead of `pr`/`commit`/hex-encoded `extra`
- `action` and `target` canonical names for provider-agnostic operations

## Implementation Pattern
1. **Metadata**: Define action, target, and description constants
2. **Validation**: Implement parameter validation without external calls
3. **Execution**: Perform GitHub API operations with proper error handling
4. **Logging**: Log execution attempts and results with executor identity
5. **Results**: Return structured ActionResult objects

## GitHub Permissions Required
- **merge-pr.ts**: `pull_requests: write`, `contents: write` (with bypass capabilities)
- **add-admin.ts**: `administration: write`
- **remove-admin.ts**: `administration: read` (list invitations), `administration: write` (remove collaborator, cancel invitation)

## Adding New Actions
1. Create new handler file implementing `ActionHandler` interface
2. Add validation logic for action-specific parameters
3. Implement execution logic using appropriate GitHub API calls
4. Export handler for registration in `../registry.ts`
5. Add comprehensive unit tests in `../../../../test/unit/`

## Guidelines
- All handlers must implement the ActionHandler interface
- Validate parameters before execution without making external calls
- Handle GitHub API errors gracefully with descriptive error messages
- Log all execution attempts with executor identity for audit trail
- Return structured ActionResult objects for consistent API responses
- Keep handlers focused on single responsibility (one action type per file)