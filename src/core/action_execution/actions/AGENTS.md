# Action Handlers

## Purpose
Individual action handler implementations for the extensible action registry system. Each handler provides validation and execution logic for specific blockchain-initiated GitHub operations.

## Scope
- Individual action handler implementations
- Action-specific validation logic
- GitHub API operation execution
- Structured result handling

## Current Implementations

### merge-pr.ts - PR_APPROVE Handler
- **Action**: `PR_APPROVE:pull_request`
- **Purpose**: Merge pull requests via DAO vote with bypass capabilities
- **Validation**: Validates PR number > 0 and repository format
- **Execution**: Merges pull request using GitHub API with bypass permissions
- **Returns**: Success with SHA or failure with error details

### add-admin.ts - ADD_ADMIN Handler  
- **Action**: `ADD_ADMIN:repository`
- **Purpose**: Add users as repository administrators via DAO vote
- **Validation**: Validates repository format and decodes GitHub username from hex data
- **Execution**: Adds user as repository collaborator with admin permissions
- **Returns**: Success with user details or failure with error details

### remove-admin.ts - REMOVE_ADMIN Handler (Basic Proof of Concept)
- **Action**: `REMOVE_ADMIN:repository`
- **Purpose**: Remove users as repository administrators via DAO vote
- **Validation**: Validates repository format and decodes GitHub username from hex data
- **Execution**: Removes user as repository collaborator 
- **Returns**: Success with user details or failure with error details
- **Critical Limitation**: Only removes active collaborators. Pending invitations remain unchanged - this is a basic implementation that does not handle all edge cases

## Handler Interface
All handlers implement the `ActionHandler` interface:
```typescript
interface ActionHandler {
  readonly action: string;        // Action name (e.g., "PR_APPROVE")
  readonly target: string;        // Target type (e.g., "pull_request")
  readonly description: string;   // Human readable description
  
  validate(parsed: CogniActionParsed): Promise<ValidationResult>;
  execute(parsed: CogniActionParsed, octokit: Octokit, logger: Application['log']): Promise<ActionResult>;
}
```

## Implementation Pattern
1. **Metadata**: Define action, target, and description constants
2. **Validation**: Implement parameter validation without external calls
3. **Execution**: Perform GitHub API operations with proper error handling
4. **Logging**: Log execution attempts and results with executor identity
5. **Results**: Return structured ActionResult objects

## GitHub Permissions Required
- **merge-pr.ts**: `pull_requests: write`, `contents: write` (with bypass capabilities)
- **add-admin.ts**: `administration: write`
- **remove-admin.ts**: `administration: write`

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