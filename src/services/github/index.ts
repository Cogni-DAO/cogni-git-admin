/**
 * GitHub Services - Convenience Re-exports
 * 
 * Provides a single entry point for all GitHub API operations.
 */

// Client factory
export { makeInstallationClient } from '../../clients/octokit.js';

// Merge operations
export type { MergeResult } from './merge.js';
export { mergePR } from './merge.js';

// Collaborator operations
export type { AddCollaboratorResult, RemoveCollaboratorResult } from './collaborators.js';
export { addAdmin, removeCollaborator } from './collaborators.js';

// Invitation operations
export type { CancelInvitationResult,ListInvitationsResult } from './invitations.js';
export { cancelInvitation,listInvitations } from './invitations.js';