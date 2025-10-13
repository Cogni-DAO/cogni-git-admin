# Utilities

## Purpose
Small, stateless helper functions used across the application.

## Scope
- Environment variable validation
- HMAC signature verification
- Idempotency checks
- Common data transformations

## Current Implementation
- **env.ts**: Two-tier environment variable validation system with Zod schemas
  - Base schema: Core requirements with conditional validation - fields required in production, optional in development/test modes (NODE_ENV=development or test)
  - Dev schema: Optional development tools (proxy URLs, capture settings, GitHub OAuth client credentials)
  - Validates on import, fails fast with clear error messages
  - Exports typed `environment` object for runtime access
  - GitHub OAuth credentials moved to dev schema as dev-only configuration
- **hmac.ts**: HMAC signature verification for webhook security
- **idempotency.ts**: Transaction deduplication logic

## Structure
- `env.ts` - Two-tier environment variable validation with conditional requirements based on NODE_ENV
- `hmac.ts` - HMAC signature verification utilities
- `idempotency.ts` - Transaction deduplication logic

## Guidelines
- Keep functions pure and stateless
- No external dependencies where possible
- Comprehensive input validation
- Clear error handling