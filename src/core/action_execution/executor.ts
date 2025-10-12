import { Octokit } from 'octokit';
import { Application } from 'probot';

import { getAction, getAvailableActions } from './registry';
import { ActionResult,CogniActionParsed } from './types';

export async function executeAction(parsed: CogniActionParsed, octokit: Octokit, logger: Application['log']): Promise<ActionResult> {
  // TODO: Add database lookup to validate DAO has permission for this repo
  // TODO: Add rate limiting per DAO/executor
  // TODO: Add audit logging to permanent storage
  
  const { action, target, repo, executor } = parsed;
  
  try {
    // Get action handler from registry
    const handler = getAction(action, target);
    
    // Validate action parameters
    const validation = handler.validate(parsed);
    if (!validation.valid) {
      logger.error(`Action validation failed: ${validation.error}`, { action, target, repo, executor });
      return { 
        success: false, 
        action: 'validation_failed', 
        error: validation.error 
      };
    }
    
    // Execute the action
    logger.info(`Executing ${action}:${target} for repo=${repo}, executor=${executor}`);
    return await handler.execute(parsed, octokit, logger);
    
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
    
    logger.error(`Action execution failed: ${errorMessage}`, { action, target, repo, executor });
    return { 
      success: false, 
      action: 'execution_failed', 
      error: errorMessage 
    };
  }
}

// Re-export types for backward compatibility
export type { ActionResult,CogniActionParsed } from './types';