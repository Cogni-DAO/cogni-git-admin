# VCS Provider Adapters

## Purpose
Provide authenticated VCS providers through factory pattern for blockchain-initiated repository operations.

## Scope
- VCS provider creation with per-execution authentication
- Repository operations across different VCS platforms (GitHub, GitLab, etc.)
- Authentication encapsulation within providers

## Architecture
```typescript
interface VcsProvider {
  mergeChange(repoRef: RepoRef, prNumber: number, params: any): Promise<MergeResult>
  grantCollaborator(repoRef: RepoRef, username: string, params: any): Promise<GrantCollaboratorResult>
  revokeCollaborator(repoRef: RepoRef, username: string): Promise<RevokeCollaboratorResult>
}
```

## Key Principles
- **Authentication Encapsulation**: Providers own authenticated clients, handlers never see tokens
- **Per-Execution Auth**: Fresh authenticated provider created for each execution
- **Clean Interfaces**: Business logic depends on interfaces, not concrete SDK clients
- **Single Auth Boundary**: All VCS authentication confined to factory creation

## Data Flow
1. **Signal Processing** → Extract `vcs`, `repoRef` from CogniSignal
2. **VCS Factory** → `createVcsProvider(vcs, app, repoRef, dao)` creates authenticated provider
3. **Provider Operation** → Execute through clean interface (no tokens, no executor params)
4. **Result** → Structured response with success/error details

## Current Implementation

### Factory Pattern (`src/factories/vcs.ts`)
- **Entry Point**: `createVcsProvider(vcs, app, repoRef, dao)`
- **Authentication**: Handles all VCS authentication internally
- **Supported VCS**: GitHub (GitLab and Radicle planned)
- **Returns**: Authenticated VCS provider ready for operations

### GitHub Provider (`github.ts`)
- **Interface**: Implements `VcsProvider` interface
- **Authentication**: Uses Probot app installation tokens
- **Operations**: Wraps `src/services/github.ts` functions
- **Behavior**: Encapsulates all GitHub-specific logic

### Result Types (`types.ts`)
- **MergeResult**: merge operation outcomes
- **GrantCollaboratorResult**: admin addition outcomes  
- **RevokeCollaboratorResult**: admin removal outcomes (handles both active collaborators and pending invitations)

## Integration Points

### Action Handlers
- Receive parsed signals with VCS type and repository reference
- Call factory to get authenticated provider
- Execute operations through clean provider interface

### Authentication Flow
- **GitHub**: Probot installation mapping via DAO address
- **GitLab**: Future OAuth or PAT implementation
- **Provider Encapsulation**: No token management in action handlers

### Error Handling
- Provider-specific errors normalized to standard result interfaces
- Authentication failures handled at factory level
- Operation failures returned through result objects

## Directory Structure
```
src/providers/vcs/
├── types.ts            # VcsProvider interface and result types
├── github.ts           # GitHub VCS provider implementation
└── CONTEXT_INTERFACE_SPEC.md  # Factory pattern specification

src/factories/
└── vcs.ts             # VCS provider factory with authentication
```

## Current Limitations
- GitHub only (GitLab, Radicle planned)
- Single installation per DAO
- GitHub App installation required
- No self-hosted VCS support

## Guidelines
- Providers encapsulate all authentication details
- Factory handles provider creation and auth setup
- Action handlers use clean provider interfaces
- Results follow consistent format across providers