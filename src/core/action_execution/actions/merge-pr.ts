import { mergePR } from '../../../services/github';
import { Signal } from '../../signal/signal';
import { ExecContext } from '../context';
import { ActionHandler, ActionResult } from '../types';

export const mergePRAction: ActionHandler = {
  action: "merge",
  target: "change",
  description: "Merge a change request (PR/MR/patch) via DAO vote",

  async run(signal: Signal, ctx: ExecContext): Promise<ActionResult> {
    const changeNumber = parseInt(signal.resource, 10);
    if (isNaN(changeNumber) || changeNumber <= 0) {
      return { 
        success: false, 
        action: 'validation_failed', 
        error: 'Resource must be a valid change number greater than 0' 
      };
    }
    
    ctx.logger.info(`Executing ${this.action} for repoUrl=${signal.repoUrl}, change=${changeNumber}, executor=${signal.executor}`);
    
    const result = await mergePR(ctx.octokit, ctx.repoRef.fullName, changeNumber, signal.executor);
    
    if (result.success) {
      ctx.logger.info(`Successfully merged change #${changeNumber} in ${ctx.repoRef.fullName}`, { sha: result.sha });
      return { 
        success: true, 
        action: 'merge_completed', 
        sha: result.sha,
        repoUrl: signal.repoUrl,
        changeNumber
      };
    } else {
      ctx.logger.error(`Failed to merge change #${changeNumber} in ${ctx.repoRef.fullName}`, { error: result.error, status: result.status });
      return { 
        success: false, 
        action: 'merge_failed', 
        error: result.error,
        repoUrl: signal.repoUrl,
        changeNumber
      };
    }
  }
};