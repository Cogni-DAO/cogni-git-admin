# Utilities

## Purpose
Small, stateless helper functions used across the application.

## Scope
- Environment variable validation
- HMAC signature verification
- Idempotency checks
- Common data transformations

## Current Implementation
- **Partial**: HMAC logic exists in `src/mw.ts`, needs to be moved here
- **Planned**: Environment validation, idempotency tracking

## Structure
- `env.ts` - Environment variable loading and validation
- `hmac.ts` - HMAC signature verification utilities
- `idempotency.ts` - Transaction deduplication logic

## Guidelines
- Keep functions pure and stateless
- No external dependencies where possible
- Comprehensive input validation
- Clear error handling