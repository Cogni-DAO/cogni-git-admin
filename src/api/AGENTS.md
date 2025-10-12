# API Layer

## Purpose
HTTP endpoints and request/response handling. Pure HTTP surface with no business logic.

## Scope
- Versioned RESTful API routes under `/api/v1/*`
- Request validation and parsing
- Response formatting
- HTTP middleware integration

## Current Implementation
- **Health Check**: Application health status endpoint
- **Webhook Routes**: GitHub and blockchain event receivers
- **Versioned API**: All endpoints under `/api/v1/*` namespace

## Structure
- `health/` - Health check and status endpoints → `/api/v1/health`
- `webhooks/` - Webhook receivers (onchain, GitHub) → `/api/v1/webhooks/*`

## Routing Strategy
- Version prefix `/v1` defined in `routes.ts`, not directory structure
- Vendor-neutral naming (onchain vs provider-specific)
- Event-specific paths: `/api/v1/webhooks/onchain/cogni-signal`

## Guidelines
- Keep handlers thin - delegate to core/services
- Validate input, format output
- Handle HTTP concerns only (status codes, headers)