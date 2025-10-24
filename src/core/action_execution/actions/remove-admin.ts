import { Octokit } from 'octokit';
import { Application } from 'probot';

import { cancelInvitation,listInvitations, removeCollaborator } from '../../../services/github';
import { ActionHandler, ActionResult,CogniActionParsed, ValidationResult } from '../types';

export const removeAdminAction: ActionHandler = {
  action: "revoke",
  target: "collaborator",
  description: "Revoke admin access from a user via DAO vote",

  validate(parsed: CogniActionParsed): ValidationResult {
    if (!parsed.repoUrl) {
      return { valid: false, error: 'repoUrl is required' };
    }
    
    if (!parsed.resource) {
      return { valid: false, error: 'Username required in resource field' };
    }
    
    // Basic GitHub username validation
    if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(parsed.resource)) {
      return { valid: false, error: `Invalid GitHub username format: ${parsed.resource}` };
    }
    
    return { valid: true };
  },

  async execute(parsed: CogniActionParsed, octokit: Octokit, logger: Application['log']): Promise<ActionResult> {
    const { repoUrl, resource: username, executor } = parsed;
    
    // Parse repo from URL
    const url = new URL(repoUrl);
    const repo = url.pathname.slice(1).replace(/\.git$/, '');
    
    logger.info(`Executing ${this.action} for repoUrl=${repoUrl}, username=${username}, executor=${executor}`);
    
    let collaboratorRemoved = false;
    let invitationCancelled = false;
    
    // Step 1: Try to remove active collaborator
    logger.info(`Attempting to remove active collaborator: ${username}`);
    const collaboratorResult = await removeCollaborator(octokit, repo, username, executor);
    
    if (collaboratorResult.success) {
      collaboratorRemoved = true;
      logger.info(`Successfully removed active collaborator: ${username}`);
    } else {
      // If 404, user is not an active collaborator - check for pending invitations
      if (collaboratorResult.status === 404) {
        logger.info(`No active collaborator found (404) - checking for pending invitations`);
      } else {
        logger.warn(`Failed to remove active collaborator: ${collaboratorResult.error}`);
      }
    }
    
    // Step 2: Always check for and cancel pending invitations
    // (User could be both an active collaborator AND have a pending invitation)
    logger.info(`Checking for pending invitations for: ${username}`);
    const invitationsResult = await listInvitations(octokit, repo, executor);
    
    if (invitationsResult.success && invitationsResult.invitations) {
        // Find invitation for this user
        const userInvitation = invitationsResult.invitations.find((invitation: { id: number; invitee?: { login: string } }) => 
          invitation.invitee?.login === username
        );
        
        if (userInvitation) {
          logger.info(`Found pending invitation ID ${userInvitation.id} for ${username}`);
          
          // Cancel the invitation
          const cancelResult = await cancelInvitation(octokit, repo, userInvitation.id, executor);
          
          if (cancelResult.success) {
            invitationCancelled = true;
            logger.info(`Successfully cancelled pending invitation for: ${username}`);
          } else {
            logger.error(`Failed to cancel invitation: ${cancelResult.error}`);
          }
      } else {
        logger.info(`No pending invitation found for: ${username}`);
      }
    } else {
      logger.warn(`Failed to list invitations: ${invitationsResult.error}`);
    }
    
    // Determine overall result
    if (collaboratorRemoved || invitationCancelled) {
      const actions = [];
      if (collaboratorRemoved) actions.push('removed active collaborator');
      if (invitationCancelled) actions.push('cancelled pending invitation');
      
      logger.info(`Successfully ${actions.join(' and ')} for ${username}`);
      
      return { 
        success: true, 
        action: 'admin_removed', 
        username, 
        repoUrl,
        collaboratorRemoved,
        invitationCancelled
      };
    } else {
      const errorMessage = `User ${username} not found as active collaborator or pending invitation`;
      logger.error(`Failed to remove admin access: ${errorMessage}`);
      
      return { 
        success: false, 
        action: 'admin_remove_failed', 
        error: errorMessage, 
        username,
        repoUrl
      };
    }
  }
};