# GitHub Authentication

## Purpose
Maps DAOs and repositories to GitHub App installation IDs for authenticated API access.

## Scope
- Installation ID resolution
- DAO-to-repository permission mapping
- GitHub App installation management

## Current Implementation
- **github.ts**: Provides `getInstallationId(dao, repo)` for installation lookup
- MVP hardcoded mapping: DAO `0xa38d03ea38c45c1b6a37472d8df78a47c1a31eb5` → `derekg1729/test-repo` → installation ID `89056469`
- Throws error for unmapped DAO/repo combinations

## Interface
```typescript
getInstallationId(dao: string, repo: string): number
```

## Data Flow
1. Receives DAO address and repository identifier
2. Looks up GitHub App installation ID for the pair
3. Returns installation ID for Octokit authentication
4. Throws error if no mapping exists

## Installation Mapping
- Each DAO+repo pair maps to a specific GitHub App installation
- Installation IDs enable Probot to authenticate as the installed app
- Multiple repositories per DAO supported (future implementation)

## Guidelines
- Replace hardcoded mapping with database lookup (TODO)
- Validate DAO permissions for repository access (TODO)
- Support multiple installations per DAO (TODO)
- Maintain installation ID cache for performance