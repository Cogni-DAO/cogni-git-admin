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
createVcsProvider(vcs: Vcs, app: Application, repoRef: RepoRef, dao: string): Promise<VcsProvider>
```

## Authentication Model
- **GitHub**: Uses Probot App installation tokens scoped per repository
- **GitLab**: OAuth tokens (future implementation)
- **Self-hosted**: Configurable authentication per host (future)

## Provider Creation Flow
1. **VCS Detection**: Extract VCS type from signal
2. **Repository Scoping**: Use repoRef for installation/token lookup
3. **Authentication**: Get platform-specific authenticated client
4. **Provider Instantiation**: Create provider with encapsulated client
5. **Interface Return**: Return clean VcsProvider interface

## Implementation Details
- **GitHub Provider**: Uses `app.auth(installationId)` with DAO-based installation mapping
- **Error Handling**: Throws for unsupported VCS types or authentication failures  
- **Type Safety**: Returns strongly-typed VcsProvider interface
- **Clean Separation**: Action handlers never see underlying SDK clients

## Current Support
- **GitHub**: Full implementation with Probot App authentication
- **GitLab**: Placeholder (throws error)
- **Radicle**: Placeholder (throws error)

## Guidelines
- Factory handles all authentication concerns
- Providers encapsulate authenticated clients
- No token/client passing to action handlers
- Each execution gets fresh provider instance
- Clean interfaces hide VCS implementation details