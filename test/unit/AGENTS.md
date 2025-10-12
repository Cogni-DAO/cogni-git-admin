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
- `add-admin-simple.test.ts` - Core ADD_ADMIN action validation and execution logic
- `remove-admin-simple.test.ts` - Core REMOVE_ADMIN action validation and execution logic