# Unit Tests

## Purpose
Fast, isolated tests for individual components following clean architecture principles.

## Scope
- Core domain logic validation (no external dependencies)
- Services layer integration with mocked external APIs
- Registry pattern and action handler functionality

## Guidelines
- Mock all external dependencies (GitHub API, RPC calls)
- Test pure business logic in isolation
- Follow existing Jest patterns and naming conventions
- Focus on critical paths and edge cases

## Current Tests
- `add-admin-simple.test.ts` - ADD_ADMIN action validation and execution
- `remove-admin-simple.test.ts` - REMOVE_ADMIN action validation and execution  
- `merge-pr-action.test.ts` - PR_APPROVE action validation and execution
- `registry.test.ts` - Action registry registration and lookup