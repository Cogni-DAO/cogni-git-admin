# CogniAction Executor

## Purpose
Business logic for executing blockchain-initiated GitHub actions. Coordinates between parsed CogniActions and GitHub operations.

## Scope
- Action execution orchestration
- Action type mapping to GitHub operations
- Execution result handling
- Business rule validation

## Current Implementation
- **executor.ts**: Executes CogniActions with `PR_APPROVE` → GitHub PR merge mapping
- Supports `PR_APPROVE` action with `pull_request` target (triggers PR merge)
- Returns structured execution results with success status and details

## Interface
```typescript
executeAction(parsed: CogniActionParsed, octokit: Octokit, logger: Application['log'])
```

## Data Flow
1. Receives parsed CogniAction from signal processing
2. Maps action type to GitHub operation (PR_APPROVE → merge)
3. Calls GitHub service with repository and PR details
4. Returns execution result with success/failure status

## Action Mappings
- **PR_APPROVE** + `pull_request` target → Merge pull request
- Other actions return unsupported status (pending implementation)

## GitHub Actions Registry
**Administrative Actions Requiring Elevated Permissions:**

### 1. `PR_APPROVE` → `mergePR()`
- **Bypass Requirement**: Merges PRs **overriding failed required status checks** and **bypassing branch protection rules**
- **GitHub Permissions**: `pull_requests: write` + `contents: write` + **bypass actor status** for protected branches
- **Current Limitation**: App must be configured as bypass actor in repository rulesets/branch protection settings
- **Justification**: DAO governance decisions must supersede automated CI failures and branch policies when explicitly voted upon onchain
- **Risk Level**: High - bypasses repository safety controls designed to prevent broken deployments
- **Use Case**: Critical fixes approved by DAO that cannot wait for CI fixes or emergency deployments overriding protection policies
- **Next Implementation Step**: Admin action to configure this app as bypass actor for protected branches in target repositories

Note: Bypass capability can be granted to specific apps/users without full admin permissions through GitHub's branch protection rules and repository rulesets.

## Guidelines
- Validate DAO permissions before execution (TODO)
- Implement rate limiting per DAO/executor (TODO)
- Maintain audit log of all executions (TODO)
- Return structured results for all execution paths