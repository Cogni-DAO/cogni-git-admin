# Core Domain Logic

## Purpose
Pure business logic with no external dependencies. Testable, predictable functions.

## Scope
- Domain object parsing and validation
- Business rule enforcement
- Data transformation
- Schema definitions

## Current Implementation
- **signal/**: CogniAction event parsing and domain types in `parser.ts`
- **actions/**: Action execution logic in `executor.ts` (coordinates with external services)
- **auth/**: Installation ID mapping in `github.ts`

## Structure
- `signal/` - CogniAction event domain logic and parsing
- `actions/` - Business logic for executing onchain actions
- `auth/` - Authentication and authorization helpers

## Guidelines
- No IO operations (no RPC calls, no file system, no HTTP)
- Pure functions only
- Comprehensive type definitions
- Easily unit testable