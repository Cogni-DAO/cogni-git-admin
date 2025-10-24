# Unit Tests

## Purpose
Fast, isolated tests for individual components following clean architecture principles with Signal-based action execution.

## Scope
- Core domain logic validation with type-safe assertions
- Services layer integration with mocked external APIs  
- Registry pattern and action handler functionality with comprehensive error cases
- VCS provider abstraction testing for multi-platform support
- Signal parsing and ExecContext validation

## Architecture (Updated October 2024)
### Signal-Based Action Execution
- **ActionHandler Interface**: Single `run(signal: Signal, ctx: ExecContext)` method replaces separate `validate`/`execute`
- **Signal Interface**: Blockchain event structure (`dao`, `chainId`, `vcs`, `repoUrl`, `action`, `target`, `resource`, `nonce`, `deadline`, `paramsJson`, `executor`)
- **ExecContext**: Resolved context with `repoRef`, `provider`, `logger`, `executor`, `params`
- **Action Keys**: Updated format - `grant:collaborator`, `revoke:collaborator`, `merge:change`

### Test Patterns
- Mock `ExecContext` with `repoRef`, `provider`, `logger` 
- Create `Signal` objects with proper blockchain event structure
- Assert on `ActionResult` properties: `success`, `action`, `repoUrl` (not `repo`)
- Validation happens within `run()` method, not separate validation step

## Guidelines
- Mock all external dependencies (GitHub API, RPC calls)
- Test pure business logic in isolation with Signal/ExecContext pattern
- Use optional chaining for safe property access in assertions
- Follow existing Jest patterns and naming conventions
- Focus on critical paths and edge cases
- Ensure type safety without non-null assertions
- Test both successful execution and validation failures within single `run()` method

## Current Tests
- `add-admin-simple.test.ts` - `grant:collaborator` action with VCS provider mocking
- `remove-admin-simple.test.ts` - `revoke:collaborator` action with VCS provider interface testing
- `merge-pr-action.test.ts` - `merge:change` action with VCS provider abstraction
- `registry.test.ts` - Action registry with `action:target` key mapping
- `vcs-github-provider.test.ts` - GitHub VCS provider service integration testing
- `vcs-factory.test.ts` - VCS provider factory with GitHub App authentication
- `vcs-repo-ref.test.ts` - Repository URL parsing and RepoRef structure validation