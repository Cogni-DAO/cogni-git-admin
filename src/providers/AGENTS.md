# Provider Adapters

## Purpose
Two distinct provider systems for normalizing external integrations:
1. **Onchain Providers** - Normalize blockchain webhook payloads for event processing
2. **VCS Providers** - Normalize VCS operations across different repository platforms

## Scope

### Onchain Providers
- Provider detection from headers/body
- Payload parsing and HMAC verification per provider  
- Normalization to common interface

### VCS Providers
- VCS platform operations (GitHub, GitLab) via host-based registry
- Repository URL parsing and provider resolution
- Token management and authentication per platform

## Architecture

### Onchain Provider Interface
```typescript
interface WebhookAdapter {
  verifySignature(headers: Record<string, string>, rawReq: any): boolean
  parse(body: any, headers: Record<string, string>): {
    txHashes: string[]
    provider: string
    deliveryId?: string
    receivedAt: number
  }
}
```

### VCS Provider Interface  
```typescript
interface VcsProvider {
  readonly name: string              // "github" | "gitlab"
  readonly host: string              // "github.com" | "gitlab.com"
  
  // Core admin operations from blockchain-initiated events
  mergePR(repoRef: RepoRef, prNumber: number, executor: string, token: string): Promise<VcsResult>
  addAdmin(repoRef: RepoRef, username: string, executor: string, token: string): Promise<VcsResult>
  removeAdmin(repoRef: RepoRef, username: string, executor: string, token: string): Promise<VcsResult>
}
```

## Current Implementation

### Onchain Providers (Existing)
- **detect.ts**: Returns "alchemy" hardcoded (MVP scope)
- **registry.ts**: Single-entry registry that returns `alchemyAdapter` for "alchemy"
- **alchemy.ts**: Exports `alchemyAdapter` with `verifySignature()` and `parse()` methods

### VCS Providers (New)
- **vcs/registry.ts**: Host-based provider registry (github.com → GitHub provider)
- **vcs/github.ts**: GitHub VCS provider wrapping existing services
- **vcs/repo-ref.ts**: Repository URL parsing utilities
- **vcs/token-source.ts**: Authentication management per host/owner

## Structure
- `onchain/` - Blockchain webhook providers  
  - `alchemy.ts` - Alchemy payload format
  - `quicknode.ts` - Future: QuickNode format  
  - `helius.ts` - Future: Solana/Helius format
  - `detect.ts` - Provider detection logic
- `vcs/` - Version control system providers (→ AGENTS.md)
  - `github.ts` - GitHub operations provider
  - `gitlab.ts` - Future: GitLab operations provider
  - `registry.ts` - Host-based provider registry  
  - `repo-ref.ts` - Repository URL parsing
  - `token-source.ts` - Authentication management

## Guidelines

### Onchain Providers
- Adapters are stateless pure functions
- Only parse and verify HMAC for their provider
- Return consistent interface regardless of provider  
- Unit test with real provider payloads

### VCS Providers
- Each provider implements identical VcsProvider interface
- Providers wrap existing service functions where possible
- Token management abstracted from providers
- All operations return consistent VcsResult format
- Registry enables easy provider addition by host
- Support standard repository URL formats for parsing