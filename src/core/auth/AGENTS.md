# Authentication & Authorization

## Purpose
Handles GitHub authentication and VCS-agnostic authorization policy for DAO repository access.

## Scope  
- GitHub App authentication with installation tokens
- VCS-agnostic DAO authorization policy
- Repository access control validation

## Current Implementation
- **github.ts**: Provides `getOctokit(app, repo)` for authenticated GitHub API clients
  - Resolves GitHub App installation for repository
  - Returns Octokit client with installation token
  - Handles installation lookup errors appropriately
- **policy.ts**: VCS-agnostic authorization policy system
  - Single `authorize()` function validates DAO repository access
  - MVP implementation allows all access (unsafe)
  - Designed for future SQLite allowlist implementation

## Interfaces
```typescript
// GitHub authentication
getOctokit(app: Application, repo: RepoRef): Promise<Octokit>

// Authorization policy  
authorize(dao: string, chainId: bigint, vcs: Vcs, repo: RepoPolicy): Promise<void>
```

## Authorization Flow  
1. **Policy Check**: `authorize()` validates DAO access to repository
2. **GitHub Auth**: `getOctokit()` resolves installation and creates authenticated client
3. **VCS Integration**: Factory uses authenticated client for provider creation

## Authentication Details
- **GitHub App Installation**: Automatic installation ID lookup via repository API
- **Scoped Access**: Each Octokit client scoped to specific repository installation
- **Error Handling**: Clear errors for missing installations or authorization failures

## Guidelines
- Authorization happens before authentication for clean separation
- Authentication clients scoped per repository execution
- Policy system designed for multi-VCS support
- Clear error messages for debugging access issues

## Technical Debt
- **Authorization Policy**: MVP allows all access - requires SQLite allowlist implementation
- **Performance**: No caching of installation lookups or policy decisions
- **Multi-VCS**: Policy system ready but only GitHub authentication implemented