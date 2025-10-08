# Webhook Handlers

## Purpose
HTTP endpoints for receiving webhooks from external services.

## Scope
- Webhook signature verification
- Payload parsing and validation
- Routing to appropriate domain handlers

## Current Implementation
- **Empty**: No webhook routes implemented yet
- **Planned**: Alchemy and GitHub webhook endpoints

## Structure
- `alchemy/` - Alchemy blockchain event webhooks
- `github/` - GitHub repository event webhooks

## Guidelines
- Verify signatures before processing
- Parse and validate payloads
- Delegate business logic to core/services
- Return appropriate HTTP status codes