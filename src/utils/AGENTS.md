# Utilities

## Purpose
Small, stateless helper functions used across the application.

## Scope
- Environment variable validation
- HMAC signature verification
- Idempotency checks
- Common data transformations

## Current Implementation
- **env.ts**: Three-tier environment variable validation system with Zod schemas
  - Base schema: Core requirements for all environments (GitHub App config, chain settings, webhook keys)
  - Dev schema: Optional development tools (proxy URLs, capture settings)
  - E2E schema: Test-specific configuration (activated when NODE_ENV=test or E2E_ENABLED=1)
  - Validates on import, fails fast with clear error messages
  - Exports typed `environment` object for runtime access
- **hmac.ts**: HMAC signature verification for webhook security
- **idempotency.ts**: Transaction deduplication logic

## Structure
- `env.ts` - Three-tier environment variable validation with conditional E2E requirements
- `hmac.ts` - HMAC signature verification utilities
- `idempotency.ts` - Transaction deduplication logic

## Guidelines
- Keep functions pure and stateless
- No external dependencies where possible
- Comprehensive input validation
- Clear error handling