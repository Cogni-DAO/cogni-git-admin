/**
 * CogniAction Registry - Extensible action mapping
 * 
 * To add a new action:
 * 1. Create action handler in ./actions/your-action.ts
 * 2. Import it here
 * 3. Add to ACTIONS registry with "ACTION:target" key
 */

import { addAdminAction } from './actions/add-admin';
import { mergePRAction } from './actions/merge-pr';
import { removeAdminAction } from './actions/remove-admin';
import { ActionHandler } from './types';

export const ACTIONS: Record<string, ActionHandler> = Object.freeze({
  "merge:change": mergePRAction,
  "grant:collaborator": addAdminAction,
  "revoke:collaborator": removeAdminAction,
});

/**
 * Get action handler by action name and target
 * @param action - Action name (e.g., "merge")
 * @param target - Target type (e.g., "change")  
 * @returns ActionHandler for the specified action:target combination
 * @throws Error if action:target combination not found
 */
export function getAction(action: string, target: string): ActionHandler {
  const key = `${action}:${target}`;
  
  if (!ACTIONS[key]) {
    throw new Error(`Unknown action: ${key}. Available: ${getAvailableActions().join(', ')}`);
  }
  
  return ACTIONS[key];
}

/**
 * Get list of available action:target combinations
 * @returns Array of action keys in format "ACTION:target"
 */
export function getAvailableActions(): string[] {
  return Object.keys(ACTIONS);
}

/**
 * Get action metadata for all registered actions
 * @returns Array of action metadata objects
 */
export function getActionMetadata() {
  return Object.values(ACTIONS).map(handler => ({
    action: handler.action,
    target: handler.target,
    description: handler.description
  }));
}