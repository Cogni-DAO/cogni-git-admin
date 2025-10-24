import { cancelInvitation,listInvitations, removeCollaborator } from '../../../services/github';
import { ActionHandler, ActionResult } from '../types';
import { Signal } from '../../signal/signal';
import { ExecContext } from '../context';

export const removeAdminAction: ActionHandler = {
  action: "revoke",
  target: "collaborator",
  description: "Revoke admin access from a user via DAO vote",

  async run(signal: Signal, ctx: ExecContext): Promise<ActionResult> {
    const username = signal.resource;
    
    if (!username) {
      return { 
        success: false, 
        action: 'validation_failed', 
        error: 'Username required in resource field' 
      };
    }
    
    // Basic GitHub username validation
    if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username)) {
      return { 
        success: false, 
        action: 'validation_failed', 
        error: `Invalid GitHub username format: ${username}` 
      };
    }
    
    ctx.logger.info(`Executing ${this.action} for repoUrl=${signal.repoUrl}, username=${username}, executor=${signal.executor}`);
    
    let collaboratorRemoved = false;
    let invitationCancelled = false;
    
    // Step 1: Try to remove active collaborator
    ctx.logger.info(`Attempting to remove active collaborator: ${username}`);
    const collaboratorResult = await removeCollaborator(ctx.octokit, ctx.repoRef.fullName, username, signal.executor);
    
    if (collaboratorResult.success) {
      collaboratorRemoved = true;
      ctx.logger.info(`Successfully removed active collaborator: ${username}`);
    } else {
      // If 404, user is not an active collaborator - check for pending invitations
      if (collaboratorResult.status === 404) {
        ctx.logger.info(`No active collaborator found (404) - checking for pending invitations`);
      } else {
        ctx.logger.warn(`Failed to remove active collaborator: ${collaboratorResult.error}`);
      }
    }
    
    // Step 2: Always check for and cancel pending invitations
    // (User could be both an active collaborator AND have a pending invitation)
    ctx.logger.info(`Checking for pending invitations for: ${username}`);
    const invitationsResult = await listInvitations(ctx.octokit, ctx.repoRef.fullName, signal.executor);
    
    if (invitationsResult.success && invitationsResult.invitations) {
        // Find invitation for this user
        const userInvitation = invitationsResult.invitations.find((invitation: { id: number; invitee?: { login: string } }) => 
          invitation.invitee?.login === username
        );
        
        if (userInvitation) {
          ctx.logger.info(`Found pending invitation ID ${userInvitation.id} for ${username}`);
          
          // Cancel the invitation
          const cancelResult = await cancelInvitation(ctx.octokit, ctx.repoRef.fullName, userInvitation.id, signal.executor);
          
          if (cancelResult.success) {
            invitationCancelled = true;
            ctx.logger.info(`Successfully cancelled pending invitation for: ${username}`);
          } else {
            ctx.logger.error(`Failed to cancel invitation: ${cancelResult.error}`);
          }
      } else {
        ctx.logger.info(`No pending invitation found for: ${username}`);
      }
    } else {
      ctx.logger.warn(`Failed to list invitations: ${invitationsResult.error}`);
    }
    
    // Determine overall result
    if (collaboratorRemoved || invitationCancelled) {
      const actions = [];
      if (collaboratorRemoved) actions.push('removed active collaborator');
      if (invitationCancelled) actions.push('cancelled pending invitation');
      
      ctx.logger.info(`Successfully ${actions.join(' and ')} for ${username}`);
      
      return { 
        success: true, 
        action: 'admin_removed', 
        username, 
        repoUrl: signal.repoUrl,
        collaboratorRemoved,
        invitationCancelled
      };
    } else {
      const errorMessage = `User ${username} not found as active collaborator or pending invitation`;
      ctx.logger.error(`Failed to remove admin access: ${errorMessage}`);
      
      return { 
        success: false, 
        action: 'admin_remove_failed', 
        error: errorMessage, 
        username,
        repoUrl: signal.repoUrl
      };
    }
  }
};