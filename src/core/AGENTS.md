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
  - Supports `PR_APPROVE:pull_request`, `ADD_ADMIN:repository`, and `REMOVE_ADMIN:repository`
- **auth/**: GitHub authentication (`github.ts`) and VCS-agnostic authorization policy (`policy.ts`)

## Structure
- `signal/` - CogniAction event domain logic and parsing
- `action_execution/` - Extensible action execution system
  - `types.ts` - Core interfaces (ActionHandler, ValidationResult, ActionResult)
  - `registry.ts` - Action registration and lookup
  - `executor.ts` - Central execution orchestrator
  - `actions/` - Individual action handler implementations
- `auth/` - GitHub authentication (`github.ts`) and authorization policy (`policy.ts`)

## Guidelines
- No IO operations (no RPC calls, no file system, no HTTP)
- Pure functions only
- Comprehensive type definitions
- Easily unit testable