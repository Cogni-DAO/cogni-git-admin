import { Octokit } from 'octokit';
import { Application } from 'probot';

import { getAction, getAvailableActions } from './registry';
import { ActionResult } from './types';
import { Signal, RepoRef } from '../signal/signal';
import { ExecContext, safeParseParams } from './context';

export async function executeAction(signal: Signal, octokit: Octokit, logger: Application['log']): Promise<ActionResult> {
  const { action, target, repoUrl, executor } = signal;
  
  try {
    // Build execution context
    const repoRef = RepoRef.parse(repoUrl);
    const params = safeParseParams(signal.paramsJson);
    const ctx: ExecContext = {
      repoRef,
      provider: 'github', // V1: hardcode to github, V2: use signal.vcs
      octokit,
      logger,
      executor,
      params
    };
    
    // Get action handler from registry
    const handler = getAction(action, target);
    
    // Execute the action with signal and context
    logger.info(`Executing ${action}:${target} for repoUrl=${repoUrl}, executor=${executor}`);
    return await handler.run(signal, ctx);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Unknown action:')) {
      logger.warn(`Unsupported action: ${action}:${target}. Available: ${getAvailableActions().join(', ')}`);
      return { 
        success: false, 
        action: 'unsupported', 
        error: `Action ${action}:${target} not implemented`,
        availableActions: getAvailableActions()
      };
    }
    
    logger.error(`Action execution failed: ${errorMessage}`, { action, target, repoUrl, executor });
    return { 
      success: false, 
      action: 'execution_failed', 
      error: errorMessage 
    };
  }
}

export type { ActionResult } from './types';