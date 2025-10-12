# Utilities

## Purpose
Small, stateless helper functions used across the application.

## Scope
- Environment variable validation
- HMAC signature verification
- Idempotency checks
- Common data transformations

## Current Implementation
- **env.ts**: Environment variable validation and loading
- **hmac.ts**: HMAC signature verification for webhook security
- **idempotency.ts**: Transaction deduplication logic

## Structure
- `env.ts` - Environment variable loading and validation
- `hmac.ts` - HMAC signature verification utilities
- `idempotency.ts` - Transaction deduplication logic

## Guidelines
- Keep functions pure and stateless
- No external dependencies where possible
- Comprehensive input validation
- Clear error handling