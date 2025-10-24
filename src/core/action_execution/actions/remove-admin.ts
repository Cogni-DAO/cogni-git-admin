import { fullName,Signal } from '../../signal/signal';
import { ExecContext } from '../context';
import { ActionHandler, ActionResult } from '../types';

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
    
    const result = await ctx.provider.revokeCollaborator(ctx.repoRef, username);
    
    if (result.success) {
      ctx.logger.info(`Successfully removed ${username} as admin from ${fullName(ctx.repoRef)}`, { username });
      return { 
        success: true, 
        action: 'admin_removed', 
        username,
        repoUrl: signal.repoUrl
      };
    } else {
      ctx.logger.error(`Failed to remove ${username} as admin from ${fullName(ctx.repoRef)}`, { error: result.error, status: result.status });
      return { 
        success: false, 
        action: 'admin_remove_failed', 
        error: result.error,
        username,
        repoUrl: signal.repoUrl
      };
    }
  }
};