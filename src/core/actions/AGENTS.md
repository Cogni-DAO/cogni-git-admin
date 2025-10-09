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
- **Admin Requirement**: Merges PRs **overriding failed required status checks** and **bypassing branch protection rules**
- **GitHub Permissions**: `administration: write` + `pull_requests: write` + `contents: write`
- **Justification**: DAO governance decisions must supersede automated CI failures and branch policies when explicitly voted upon onchain
- **Risk Level**: High - bypasses repository safety controls
- **Use Case**: Critical fixes approved by DAO that cannot wait for CI fixes or need to override protection policies for urgent deployment

Future actions will follow similar patterns requiring administrative permissions to override repository policies based on DAO consensus.

## Guidelines
- Validate DAO permissions before execution (TODO)
- Implement rate limiting per DAO/executor (TODO)
- Maintain audit log of all executions (TODO)
- Return structured results for all execution paths