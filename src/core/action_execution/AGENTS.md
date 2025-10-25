# Action Execution

## Purpose
Signal + Context pattern for blockchain-initiated VCS operations. Provides authenticated VCS providers and clean execution context.

## Scope
- Action handler registration and discovery
- VCS provider factory integration
- Execution context building
- Signal parameter validation

## Architecture
- **Signal + Context Pattern**: Handlers receive `run(signal: Signal, ctx: ExecContext)`
- **VCS Factory Integration**: Authenticated providers created per execution
- **Registry Pattern**: Actions registered by `action:target` keys
- **Clean Separation**: Parsing/validation separate from execution

## Components
- **executor.ts**: Main execution orchestrator
  - Creates authenticated VCS providers via factory
  - Builds execution context with parsed parameters
  - Routes to action handlers via registry
- **context.ts**: `ExecContext` interface with VCS provider
- **registry.ts**: Action handler registration
- **types.ts**: `ActionHandler` interface and `ActionResult`

## Execution Flow
1. **Signal Processing** → `executeAction(signal, app, logger)`
2. **Repository Parsing** → Extract `repoRef` from signal
3. **VCS Provider Creation** → Factory validates authorization and creates authenticated provider
4. **Parameter Parsing** → VCS-aware parameter validation
5. **Context Building** → Assemble `ExecContext` with provider
6. **Handler Execution** → `handler.run(signal, ctx)`

## Interfaces

### Action Handler
```typescript
interface ActionHandler {
  run(signal: Signal, ctx: ExecContext): Promise<ActionResult>
}
```

### Execution Context
```typescript
interface ExecContext {
  repoRef: RepoRef;           // Parsed repository reference
  provider: VcsProvider;      // Authenticated VCS provider  
  logger: Application['log']; // Logger instance
  executor: string;           // Executor address
  params: MergeChangeParams | GrantCollaboratorParams | RevokeCollaboratorParams; // Typed parameters
}
```

## Current Actions
- **merge:change** → Merge pull request with bypass capabilities
- **grant:collaborator** → Add repository administrator
- **revoke:collaborator** → Remove administrator or cancel invitation

## VCS Integration
- **Factory Pattern**: `createVcsProvider(vcs, app, repoRef, dao, chainId)` 
- **Authorization**: DAO authorization validated before authentication
- **Authentication**: Handled at VCS provider level with installation tokens
- **Provider Interface**: Clean operations without token management
- **Multi-VCS Support**: GitHub implemented, GitLab/Radicle planned

## Error Handling
- **Unsupported Actions**: Returns available actions list
- **VCS Failures**: Propagated through provider results
- **Parameter Validation**: Handled by params module
- **Structured Results**: Consistent `ActionResult` format

## Guidelines
- Action handlers focus on business logic, not authentication
- VCS providers encapsulate all platform-specific details
- Parameters validated before handler execution
- All operations return structured results
- Logging includes signal metadata for audit trails