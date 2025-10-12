# CogniAction Executor

## Purpose
Extensible action execution system for blockchain-initiated GitHub operations. Implements a registry pattern for pluggable action handlers.

## Scope
- Action handler registration and discovery
- Action validation and execution orchestration
- Structured result handling
- Business rule enforcement

## Current Implementation

### Architecture
- **Registry Pattern**: Actions registered as `ACTION:target` pairs in centralized registry
- **Handler Interface**: Each action implements `ActionHandler` with validate/execute methods
- **Type Safety**: Full TypeScript interfaces for actions, validation, and results

### Components
- **types.ts**: Core interfaces (`ActionHandler`, `CogniActionParsed`, `ValidationResult`, `ActionResult`)
- **registry.ts**: Central action registry with lookup and metadata functions
- **executor.ts**: Orchestrates validation and execution through registered handlers
- **actions/**: Individual action handler implementations
  - `merge-pr.ts`: PR_APPROVE handler for merging pull requests
  - `add-admin.ts`: ADD_ADMIN handler for adding repository administrators

## Interfaces

### Primary Execution Interface
```typescript
executeAction(parsed: CogniActionParsed, octokit: Octokit, logger: Application['log']): Promise<ActionResult>
```

### Action Handler Interface
```typescript
interface ActionHandler {
  readonly action: string;        // Action name (e.g., "PR_APPROVE")
  readonly target: string;        // Target type (e.g., "pull_request")
  readonly description: string;   // Human readable description
  
  validate(parsed: CogniActionParsed): Promise<ValidationResult>;
  execute(parsed: CogniActionParsed, octokit: Octokit, logger: Application['log']): Promise<ActionResult>;
}
```

## Data Flow
1. Receives parsed CogniAction from signal processing
2. Looks up handler via registry using `action:target` key
3. Validates action parameters through handler's validate method
4. Executes action through handler's execute method
5. Returns structured `ActionResult` with success status and metadata

## Registered Actions

### Current Actions
- **PR_APPROVE:pull_request** → Merge pull request via DAO vote
- **ADD_ADMIN:repository** → Add user as repository admin via DAO vote
- **REMOVE_ADMIN:repository** → Remove user as repository admin via DAO vote (basic proof of concept)

### Adding New Actions
1. Create handler file in `actions/` implementing `ActionHandler` interface
2. Import handler in `registry.ts`
3. Add to `ACTIONS` object with `ACTION:target` key
4. Handler automatically available for execution

## Action Details

### 1. `PR_APPROVE:pull_request`
- **Bypass Requirement**: Merges PRs **overriding failed required status checks** and **bypassing branch protection rules**
- **GitHub Permissions**: `pull_requests: write` + `contents: write` + **bypass actor status** for protected branches
- **Current Limitation**: App must be configured as bypass actor in repository rulesets/branch protection settings
- **Justification**: Merges a PR when explicitly authorized by a DAO decision. Requires repository ruleset configuration that lists the Cogni Admin app as a bypass actor for selected branches. At runtime the app uses pull_requests:write and contents:write; no global admin token is used. This action is high risk and is gated by on-chain authorization, branch scoping, and audit logging.
- **Risk Level**: High - bypasses repository safety controls designed to prevent broken deployments
- **Use Case**: Critical fixes approved by DAO that cannot wait for CI fixes or emergency deployments overriding protection policies
- **Next Implementation Step**: Admin action to configure this app as bypass actor for protected branches in target repositories

### 2. `ADD_ADMIN:repository`
- **Handler**: `actions/add-admin.ts`
- **GitHub Operation**: Adds user as repository collaborator with admin permissions
- **Parameters**: 
  - `repo`: Repository in `owner/repo` format  
  - `extra`: ABI-encoded string containing GitHub username
  - `target`: Must be "repository"
  - `pr`: Unused (set to 0)
  - `commit`: Unused (set to bytes32(0))
- **Validation**: Validates repo format and decodes/validates GitHub username
- **Permissions Required**: `administration: write` on repository
- **Risk Level**: High - grants full administrative access to repository
- **Use Case**: DAO-approved administrative access for trusted contributors

### 3. `REMOVE_ADMIN:repository`
- **Handler**: `actions/remove-admin.ts`
- **GitHub Operations**: 
  - Removes active repository collaborator
  - Cancels pending repository invitations
- **Parameters**: 
  - `repo`: Repository in `owner/repo` format  
  - `extra`: ABI-encoded string containing GitHub username
  - `target`: Must be "repository"
  - `pr`: Unused (set to 0)
  - `commit`: Unused (set to bytes32(0))
- **Validation**: Validates repo format and decodes/validates GitHub username
- **Permissions Required**: `administration: write` on repository
- **Risk Level**: Medium - removes administrative access from repository
- **Use Case**: DAO-approved removal of administrative access
- **Enhanced Functionality**: Handles both active collaborators AND pending invitations. Will attempt to remove active collaborator and/or cancel pending invitation as appropriate. Returns success if either operation succeeds.

Note: Bypass capability for PR_APPROVE can be granted to specific apps/users without full admin permissions through GitHub's branch protection rules and repository rulesets.

## Guidelines
- All actions must implement the `ActionHandler` interface
- Validate parameters in the validate method before execution
- Return structured `ActionResult` objects for consistent API responses
- Log all execution attempts with executor identity for audit trail
- Handle errors gracefully with descriptive error messages

## Future Enhancements (TODOs in code)
- Database lookup to validate DAO permissions for repositories
- Rate limiting per DAO/executor to prevent abuse
- Persistent audit logging for compliance and debugging
- Additional action types as required by DAO governance needs