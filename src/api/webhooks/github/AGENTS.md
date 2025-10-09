# GitHub Webhook Handler

## Purpose
Receives GitHub repository webhooks for standard Probot functionality.

## Scope
- POST `/api/v1/webhooks/github` endpoint
- GitHub webhook signature verification
- Repository event handling
- Integration with Probot framework

## Current Implementation
- **Partial**: Basic Probot handlers exist in `src/index.ts`
- **Status**: Issues.opened handler implemented

## Structure
- `route.ts` - GitHub webhook endpoint (future)

## Guidelines
- Maintain compatibility with existing Probot patterns
- Handle GitHub webhook security
- Delegate to appropriate GitHub services