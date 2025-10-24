import { fullName, Signal } from '../../signal/signal';
import { ExecContext } from '../context';
import { ActionHandler, ActionResult, MergeChangeParams } from '../types';

export const mergePRAction: ActionHandler = {
  action: "merge",
  target: "change",
  description: "Merge a change request (PR/MR/patch) via DAO vote",

  async run(signal: Signal, ctx: ExecContext): Promise<ActionResult> {
    const pr = Number(signal.resource);
    if (!Number.isInteger(pr) || pr <= 0) {
      return { 
        success: false, 
        action: 'validation_failed', 
        error: 'resource must be a positive integer' 
      };
    }
    
    ctx.logger.info(`Executing ${this.action} for repoUrl=${signal.repoUrl}, change=${pr}, executor=${signal.executor}`);
    
    const result = await ctx.provider.mergeChange(ctx.repoRef, pr, ctx.params as MergeChangeParams);
    
    if (result.success) {
      ctx.logger.info(`Successfully merged change #${pr} in ${fullName(ctx.repoRef)}`, { sha: result.sha });
      return { 
        success: true, 
        action: 'merge_completed', 
        sha: result.sha,
        repoUrl: signal.repoUrl,
        changeNumber: pr
      };
    } else {
      ctx.logger.error(`Failed to merge change #${pr} in ${fullName(ctx.repoRef)}`, { error: result.error, status: result.status });
      return { 
        success: false, 
        action: 'merge_failed', 
        error: result.error,
        repoUrl: signal.repoUrl,
        changeNumber: pr
      };
    }
  }
};