import { fullName, Signal } from '../../signal/signal';
import { ExecContext } from '../context';
import { ActionHandler, ActionResult, GrantCollaboratorParams } from '../types';

export const addAdminAction: ActionHandler = {
  action: "grant",
  target: "collaborator",
  description: "Grant admin access to a user via DAO vote",

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
    
    const result = await ctx.provider.grantCollaborator(ctx.repoRef, username, ctx.params as GrantCollaboratorParams);
    
    if (result.success) {
      ctx.logger.info(`Successfully added ${username} as admin to ${fullName(ctx.repoRef)}`, { username, status: result.status });
      return { 
        success: true, 
        action: 'admin_added', 
        username, 
        permission: 'admin',
        repoUrl: signal.repoUrl
      };
    } else {
      ctx.logger.error(`Failed to add ${username} as admin to ${fullName(ctx.repoRef)}`, { error: result.error, status: result.status });
      return { 
        success: false, 
        action: 'admin_add_failed', 
        error: result.error, 
        username,
        repoUrl: signal.repoUrl
      };
    }
  }
};