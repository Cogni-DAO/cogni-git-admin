import { ActionHandler, CogniActionParsed, ValidationResult, ActionResult } from '../types';
import { removeCollaborator, listInvitations, cancelInvitation } from '../../../services/github';
import { Octokit } from 'octokit';
import { Application } from 'probot';

export const removeAdminAction: ActionHandler = {
  action: "REMOVE_ADMIN",
  target: "repository",
  description: "Remove a user as repository admin via DAO vote",

  async validate(parsed: CogniActionParsed): Promise<ValidationResult> {
    if (!parsed.repo.includes('/')) {
      return { valid: false, error: 'Repo must be in format "owner/repo"' };
    }
    
    if (!parsed.extra || parsed.extra.length === 0) {
      return { valid: false, error: 'Username required in extra data' };
    }
    
    // Try to decode username to validate it's properly encoded
    try {
      const extraHex = parsed.extra.startsWith('0x') ? parsed.extra.slice(2) : parsed.extra;
      const username = Buffer.from(extraHex, 'hex').toString('utf8').replace(/\0/g, '');
      
      if (!username) {
        return { valid: false, error: 'Could not decode username from extra data' };
      }
      
      // Basic GitHub username validation
      if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username)) {
        return { valid: false, error: `Invalid GitHub username format: ${username}` };
      }
      
    } catch (error) {
      return { valid: false, error: 'Invalid username encoding in extra data' };
    }
    
    return { valid: true };
  },

  async execute(parsed: CogniActionParsed, octokit: Octokit, logger: Application['log']): Promise<ActionResult> {
    const { repo, executor } = parsed;
    
    // Decode username from extra bytes
    let username: string;
    try {
      const extraHex = parsed.extra.startsWith('0x') ? parsed.extra.slice(2) : parsed.extra;
      username = Buffer.from(extraHex, 'hex').toString('utf8').replace(/\0/g, '');
    } catch (error) {
      logger.error(`Failed to decode username from extra data: ${parsed.extra}`, { error });
      return { success: false, action: 'decode_failed', error: 'Invalid username encoding' };
    }
    
    logger.info(`Executing ${this.action} for repo=${repo}, username=${username}, executor=${executor}`);
    
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
        const userInvitation = invitationsResult.invitations.find((invitation: any) => 
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
        repo,
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
        repo
      };
    }
  }
};