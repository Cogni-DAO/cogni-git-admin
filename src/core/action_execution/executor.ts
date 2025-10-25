import { Application } from 'probot';

import { createVcsProvider } from '../../factories/vcs';
import { parseParams, signalToLog } from '../signal/params';
import { parseRepoRef, Signal } from '../signal/signal';
import { ExecContext } from './context';
import { getAction, getAvailableActions } from './registry';
import { ActionResult } from './types';

export async function executeAction(signal: Signal, app: Application, logger: Application['log']): Promise<ActionResult> {
  const { action, target, repoUrl, executor, vcs } = signal;
  
  try {
    // Parse repository reference
    const repoRef = parseRepoRef(repoUrl);
    
    // Create authenticated VCS provider
    const provider = await createVcsProvider(vcs, app, repoRef, signal.dao, signal.chainId);
    
    // Parse and validate parameters with context
    const params = parseParams(action, target, signal.paramsJson);
    
    // Build execution context with authenticated provider
    const ctx: ExecContext = {
      repoRef,
      provider,
      logger,
      executor,
      params
    };
    
    // Get action handler from registry
    const handler = getAction(action, target);
    
    // Execute the action with signal and context
    logger.info({ signal: signalToLog(signal) }, `exec ${action}:${target}`);
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