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
- **action_execution/**: Extensible action registry system with pluggable action handlers
  - Registry pattern for mapping action:target pairs to specific handlers
  - Type-safe action execution with validation and structured results
  - Currently supports `PR_APPROVE:pull_request` and `ADD_ADMIN:repository`
- **auth/**: Installation ID mapping in `github.ts`

## Structure
- `signal/` - CogniAction event domain logic and parsing
- `action_execution/` - Extensible action execution system
  - `types.ts` - Core interfaces (ActionHandler, ValidationResult, ActionResult)
  - `registry.ts` - Action registration and lookup
  - `executor.ts` - Central execution orchestrator
  - `actions/` - Individual action handler implementations
- `auth/` - Authentication and authorization helpers

## Guidelines
- No IO operations (no RPC calls, no file system, no HTTP)
- Pure functions only
- Comprehensive type definitions
- Easily unit testable