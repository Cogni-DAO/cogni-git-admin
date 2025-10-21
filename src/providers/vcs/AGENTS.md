# VCS Provider Adapters

## Purpose
Normalize different VCS platform operations into consistent interface for blockchain-initiated repository administration.

## Scope
- VCS provider registration by host (github.com, gitlab.com)
- Repository URL parsing and provider resolution
- Token management per host/owner
- Atomic VCS operations (merge PR, add/remove admin)

## Architecture
```typescript
interface VcsProvider {
  readonly name: string              // "github" | "gitlab"
  readonly host: string              // "github.com" | "gitlab.com"
  
  // Core admin operations
  mergePR(repoRef: RepoRef, prNumber: number, executor: string, token: string): Promise<VcsResult>
  addAdmin(repoRef: RepoRef, username: string, executor: string, token: string): Promise<VcsResult>
  removeAdmin(repoRef: RepoRef, username: string, executor: string, token: string): Promise<VcsResult>
}

interface RepoRef {
  host: string        // "github.com" 
  owner: string       // "derekg1729"
  repo: string        // "test-repo"
  url: string         // Full URL for reference
}
```

## Data Flow
1. **CogniSignal Event** → Contains `repo_url` field  
2. **RepoRef.parse(repo_url)** → Extract `{host, owner, repo}`
3. **ProviderRegistry.get(host)** → Get VCS provider for host
4. **TokenSource.getToken(host, owner)** → Get access token 
5. **Provider.adminOperation()** → Execute through provider
6. **VcsResult** → Structured response with success/error

## Current Implementation Plan

### Core Components
- **registry.ts** - ProviderRegistry keyed by host (github.com, gitlab.com)
- **repo-ref.ts** - RepoRef.parse() for URL → {host, owner, repo} 
- **token-source.ts** - TokenSource.getToken(host, owner) for auth
- **github.ts** - GitHub VCS provider implementation
- **gitlab.ts** - GitLab VCS provider implementation (future)

### Provider Resolution Strategy
```typescript
// From CogniSignal event
const repoUrl = "https://github.com/derekg1729/test-repo"

// Parse repo reference  
const repoRef = RepoRef.parse(repoUrl) // {host: "github.com", owner: "derekg1729", repo: "test-repo"}

// Get provider for host
const provider = ProviderRegistry.get(repoRef.host) // GitHub provider

// Get token for host/owner
const token = await TokenSource.getToken(repoRef.host, repoRef.owner)

// Execute operation
const result = await provider.addAdmin(repoRef, "newuser", "executor", token)
```

### Integration Points

#### Action Handlers
- Action handlers receive parsed CogniSignal with repo_url
- Build RepoRef from repo_url
- Get provider from registry by host
- Execute operations through provider interface

#### Token Management  
- **No Global Tokens** - All tokens scoped to host/owner
- **GitHub**: Use existing Probot installation mapping
- **GitLab**: Future - OAuth tokens or PATs per project

#### Error Handling
- Provider-agnostic error codes and messages
- Consistent VcsResult interface across providers
- Fallback behavior for unsupported hosts

## Directory Structure
```
src/providers/vcs/
├── AGENTS.md           # This file - architecture overview  
├── registry.ts         # ProviderRegistry - host → provider mapping
├── repo-ref.ts         # RepoRef.parse() - URL parsing utilities
├── token-source.ts     # TokenSource.getToken() - auth management
├── github.ts           # GitHub VCS provider implementation
├── gitlab.ts           # GitLab VCS provider (future)
├── types.ts           # VcsProvider, VcsResult, RepoRef interfaces
└── detect.ts          # Provider detection fallback (future)
```

## Provider Implementations

### GitHub Provider (`github.ts`)
- **Host**: `github.com`
- **Token Source**: Probot installation auth
- **Operations**: Wraps existing `src/services/github.ts` functions
- **Authentication**: Uses installation-scoped tokens via Probot

### GitLab Provider (`gitlab.ts`) - Future
- **Host**: `gitlab.com` 
- **Token Source**: OAuth tokens or project access tokens
- **Operations**: GitLab API equivalents (merge MR, add maintainer)
- **Authentication**: OAuth flow or PAT management

## MVP Limitations
- **Public Hosts Only**: github.com, gitlab.com (no self-hosted instances)
- **Single Token per Host**: No multi-token management
- **Basic Provider Detection**: Host-based only, no advanced detection

## Guidelines  
- Each provider implements identical VcsProvider interface
- Providers wrap existing service functions where possible
- Token management abstracted from providers
- RepoRef parsing handles various URL formats
- Registry enables easy provider addition
- All operations return consistent VcsResult format

## Future Considerations
- Self-hosted instance support (github.enterprise.com, custom GitLab)
- Advanced provider detection (API probing, .well-known endpoints)
- Multi-token management per repository
- Rate limiting per provider
- Provider health checks and fallbacks