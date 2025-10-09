# GitHub Installation Webhook Fixtures

Captured GitHub App installation event webhooks.

## Purpose
Contains real webhook payloads from GitHub when the cogni-git-admin GitHub App is installed, updated, or removed from repositories. These fixtures document the webhook structure and enable testing of GitHub App lifecycle management.

## Event Types

### Installation Created
Triggered when the GitHub App is installed on a user account or organization. Contains:
- **Installation metadata**: ID, target type (User/Organization), created timestamp
- **Permissions granted**: Actions, pull requests, deployments, workflows, etc.
- **Repository access**: List of repositories the app can access
- **Account details**: User/org that installed the app

## Current Fixtures

### `2025-10-09T07-54-21-885Z_github_installation_b4cb1720-a35d-11f0-9d49-162ed0acba35.json`
**Event**: Installation created for test-cogni-admin-derekg1729 app
- **Installation ID**: 89056469
- **Target**: User account `derekg1729` (ID: 58641509)
- **Repository**: `derekg1729/test-repo` (ID: 1064412804)
- **Permissions**: Full write access to actions, pull requests, deployments, workflows
- **App**: test-cogni-admin-derekg1729 (ID: 2075427)

## Headers
Preserved GitHub-specific headers include:
- `x-github-event`: Event type identifier (`installation`)
- `x-github-delivery`: Unique delivery ID for idempotency
- `x-hub-signature`/`x-hub-signature-256`: HMAC signatures for verification
- `x-github-hook-id`: Webhook configuration identifier
- `x-github-hook-installation-target-id`: GitHub App ID

## Integration with Probot
These fixtures document the webhook structure that Probot processes when:
- App is initially installed on repositories
- Installation permissions are modified
- App is uninstalled from repositories

## Usage Scenarios
While installation events are not actively processed by the application logic, these fixtures:
1. Document the webhook payload structure for future implementation
2. Enable testing of Probot's webhook routing and signature verification
3. Provide reference data for GitHub App lifecycle management
4. Support development of installation-based features (e.g., onboarding flows)

## Data Preservation
Installation webhooks contain sensitive installation tokens and permissions data. The base64 encoding ensures:
- Complete preservation of GitHub's webhook structure
- Valid signatures for HMAC verification testing
- Accurate representation of production webhook payloads

## Capture Process
Installation webhooks are captured when:
1. GitHub App is installed/updated via GitHub UI
2. Webhooks are routed through Smee proxy to capture server
3. Capture server saves complete webhook with metadata
4. Fixtures are organized by event type for easy reference