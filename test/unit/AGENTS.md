# Unit Tests

## Purpose
Fast, isolated tests for individual components following clean architecture principles.

## Scope
- Core domain logic validation with type-safe assertions
- Services layer integration with mocked external APIs
- Registry pattern and action handler functionality with comprehensive error cases

## Guidelines
- Mock all external dependencies (GitHub API, RPC calls)
- Test pure business logic in isolation
- Use optional chaining for safe property access in assertions
- Follow existing Jest patterns and naming conventions
- Focus on critical paths and edge cases
- Ensure type safety without non-null assertions

## Current Tests
- `add-admin-simple.test.ts` - ADD_ADMIN action validation and execution
- `remove-admin-simple.test.ts` - REMOVE_ADMIN action validation and execution  
- `merge-pr-action.test.ts` - PR_APPROVE action validation and execution
- `registry.test.ts` - Action registry registration and lookup