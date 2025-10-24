# VCS Provider Architecture Specification

## Overview

The VCS provider system enables cogni-git-admin to execute repository administration operations across multiple VCS platforms (GitHub, GitLab, etc.) through a unified interface. The architecture maintains strict separation between business logic and VCS-specific implementations.

## Core Principles

### Single Source of Truth
- One parser owns the ABI � Signal conversion
- All components consume Signal; no field threading across layers

### Separation of Concerns
- **Execution**: Business logic handlers operate on normalized interfaces
- **Providers**: VCS-specific implementations hidden behind clean interfaces
- **Authentication**: Confined to provider creation boundary

### Stable Interfaces
- Business logic targets small, provider-agnostic ports (`VcsProvider`)
- Provider implementations can be swapped without touching handlers
- ABI changes only affect parser; handlers remain stable

### Dependency Inversion
- High-level code depends on interfaces, not concrete SDK clients
- Providers are injected at execution boundary
- No direct SDK instantiation (`new Octokit()`) outside providers

### Least Privilege
- Authentication tokens/clients never passed to handlers
- Providers own and encapsulate their authenticated clients
- Handlers see only the minimal interface they need

## Architecture Components

### VcsProvider Interface  
Clean, minimal interface with typed results and encapsulated auth:
- `mergeChange(repoRef, prNumber, params): Promise<MergeResult>`
- `grantCollaborator(repoRef, username, params): Promise<GrantCollaboratorResult>`
- `revokeCollaborator(repoRef, username): Promise<RevokeCollaboratorResult>`

Provider methods don't take ctx - auth is encapsulated in the provider instance.

### Provider Factory
Single authentication boundary with no global state:
- Signature: `createVcsProvider(vcs, app, repoRef): Promise<VcsProvider>`
- Handles all VCS-specific authentication internally (GitHub App, GitLab tokens)
- No registries, no caching, no global state - pure factory function
- Returns configured provider with encapsulated authenticated client

### Provider Implementations
VCS-specific classes that:
- Accept authenticated SDK client via constructor
- Map VCS APIs to standardized `VcsProvider` interface
- Handle VCS-specific error handling and response normalization
- Never expose underlying SDK types to callers

## Data Flow

1. **Signal Parsing**: Blockchain event � normalized `Signal` object
2. **Provider Creation**: Factory creates authenticated provider for `signal.vcs`
3. **Context Building**: Executor builds `AdminContext` with provider
4. **Handler Execution**: Pure handler functions use `ctx.provider.*()` methods
5. **Provider Mapping**: Provider maps calls to underlying VCS APIs

## Authentication Model

### Per-Execution Authentication
- No global provider instances or registries
- Each execution creates fresh authenticated provider
- Installation tokens are scoped per repository/installation

### Authentication Boundary
- Authentication logic confined to provider factory
- Handlers never see tokens, SDK clients, or auth concerns
- Providers own their authenticated clients throughout execution

### VCS-Specific Auth
- **GitHub**: Uses Probot App authentication with installation IDs
- **GitLab**: Uses scoped access tokens (future implementation)
- **Self-hosted**: Configurable per host (future implementation)

## Provider Contract

### Input Normalization
Providers accept standardized parameters:
- Repository reference: `{ owner, repo }` structure
- Resource identifiers: PR numbers, usernames
- Optional parameters: merge methods, permissions

### Output Standardization
Providers return consistent `VcsResult` structure:
- Success/failure status
- Relevant data (SHA for merges, status codes for admin operations)
- Normalized error messages

### Error Handling
Providers translate VCS-specific errors to standard formats while preserving actionable information for handlers.

## Future Extensibility

### Adding New VCS Providers
1. Implement `VcsProvider` interface with VCS-specific SDK
2. Add case to provider factory with authentication logic
3. Handlers automatically work with new provider (no changes needed)

### Adding New Operations
1. Extend `VcsProvider` interface with new method
2. Implement method in all existing providers
3. Add handler that uses new method

This architecture ensures that ABI changes touch only the parser, VCS additions require no handler changes, and authentication concerns remain properly encapsulated.