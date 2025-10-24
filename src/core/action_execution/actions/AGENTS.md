# Action Handlers

## Purpose
Signal + Context action handlers for blockchain-initiated VCS operations. Each handler implements business logic for specific repository operations.

## Scope
- Individual action handler implementations
- Signal validation and parameter extraction
- VCS provider operations through clean interfaces
- Structured result handling

## Current Implementations

### merge-pr.ts
- **Action**: `merge:change`
- **Purpose**: Merge pull request with DAO authorization
- **Interface**: `run(signal: Signal, ctx: ExecContext)`
- **Logic**: Validates PR number from `signal.resource`, calls VCS provider merge operation
- **Returns**: Success with SHA or validation/execution failure

### add-admin.ts
- **Action**: `grant:collaborator`  
- **Purpose**: Grant repository admin access
- **Interface**: `run(signal: Signal, ctx: ExecContext)`
- **Logic**: Validates username from `signal.resource`, calls VCS provider grant operation
- **Returns**: Success with user details or failure

### remove-admin.ts
- **Action**: `revoke:collaborator`
- **Purpose**: Remove repository admin access
- **Interface**: `run(signal: Signal, ctx: ExecContext)`
- **Logic**: Validates username, calls VCS provider revoke operation (handles both active collaborators and pending invitations)
- **Returns**: Success with operation details or failure

## Handler Interface
```typescript
interface ActionHandler {
  action: string;             // Action name (merge, grant, revoke)
  target: string;             // Target type (change, collaborator)  
  description: string;        // Human readable description
  run(signal: Signal, ctx: ExecContext): Promise<ActionResult>
}
```

## Implementation Pattern
1. **Parameter Validation**: Extract and validate parameters from signal.resource
2. **Business Logic**: Implement action-specific logic
3. **VCS Operation**: Call VCS provider through clean interface (ctx.provider.*)
4. **Result Handling**: Return structured ActionResult
5. **Logging**: Log operations with signal metadata

## VCS Provider Integration
- **Clean Interface**: Handlers use `ctx.provider` for VCS operations
- **Authentication**: Handled by VCS provider (no token management)
- **Multi-VCS Support**: Same handler works across GitHub, GitLab, etc.
- **Provider Abstraction**: Handlers don't know implementation details

## Signal Schema Usage
- **repoUrl**: Full repository URL for VCS provider resolution
- **resource**: Action-specific data (PR number, username)
- **action/target**: Provider-agnostic operation identifiers
- **executor**: Blockchain transaction executor address
- **params**: Additional parameters from signal.paramsJson

## Error Handling
- **Validation Errors**: Return `validation_failed` action with descriptive message
- **VCS Errors**: Propagate provider results with operation details  
- **Logging**: All operations logged with executor identity for auditing
- **Structured Results**: Consistent ActionResult format

## Guidelines
- Extract parameters from Signal fields, validate before VCS calls
- Use VCS provider interface, avoid direct GitHub/GitLab API calls
- Focus on business logic, let VCS provider handle platform specifics
- Return structured results with success flag and operation details
- Log with signal metadata for audit trails