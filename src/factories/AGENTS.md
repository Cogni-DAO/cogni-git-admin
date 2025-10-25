# VCS Provider Factory

## Purpose
Single authentication boundary for creating authenticated VCS provider instances. Implements dependency inversion by providing clean interfaces without exposing authentication details.

## Scope
- VCS provider creation with per-execution authentication
- Authentication encapsulation for different VCS platforms
- Provider interface abstraction for action handlers

## Architecture Principles
- **Single Authentication Boundary**: All VCS authentication handled here
- **No Global State**: Pure factory function, no registries or caching
- **Dependency Inversion**: Handlers depend on interfaces, not concrete clients
- **Per-Execution Auth**: Fresh authenticated provider per execution

## Factory Interface
```typescript
createVcsProvider(vcs: Vcs, app: Application, repoRef: RepoRef, dao: string, chainId: bigint): Promise<VcsProvider>
```

## Authentication Model
- **GitHub**: Uses Probot App installation tokens scoped per repository
- **GitLab**: OAuth tokens (future implementation)
- **Self-hosted**: Configurable authentication per host (future)

## Provider Creation Flow
1. **Authorization Check**: Validate DAO access via policy system
2. **VCS Detection**: Route to platform-specific authentication
3. **Authentication**: Get platform-specific authenticated client  
4. **Provider Instantiation**: Create provider with encapsulated client
5. **Interface Return**: Return clean VcsProvider interface

## Implementation Details
- **Authorization Integration**: Uses VCS-agnostic policy system before authentication
- **GitHub Provider**: Uses `getOctokit()` for scoped installation authentication
- **Error Handling**: Throws for unauthorized access, unsupported VCS, or auth failures
- **Type Safety**: Returns strongly-typed VcsProvider interface
- **Clean Separation**: Action handlers never see underlying SDK clients or authorization logic

## Current Support
- **GitHub**: Full implementation with Probot App authentication
- **GitLab**: Placeholder (throws error)
- **Radicle**: Placeholder (throws error)

## Guidelines
- Factory handles authorization and authentication as single boundary
- Authorization checked before any VCS-specific authentication
- Providers encapsulate authenticated clients and hide authorization logic
- Each execution gets fresh provider with validated access
- Clean interfaces hide VCS implementation and policy details