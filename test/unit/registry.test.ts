// Registry Functionality Tests
import { getAction, getActionMetadata,getAvailableActions } from '../../src/core/action_execution/registry';

describe('Action Registry', () => {
  test('getAction returns correct handler for ADD_ADMIN:repository', () => {
    const handler = getAction('ADD_ADMIN', 'repository');
    
    expect(handler).toBeDefined();
    expect(handler.action).toBe('ADD_ADMIN');
    expect(handler.target).toBe('repository');
    expect(handler.description).toBeDefined();
    expect(typeof handler.validate).toBe('function');
    expect(typeof handler.execute).toBe('function');
  });

  test('getAction returns correct handler for REMOVE_ADMIN:repository', () => {
    const handler = getAction('REMOVE_ADMIN', 'repository');
    
    expect(handler).toBeDefined();
    expect(handler.action).toBe('REMOVE_ADMIN');
    expect(handler.target).toBe('repository');
    expect(handler.description).toBeDefined();
    expect(typeof handler.validate).toBe('function');
    expect(typeof handler.execute).toBe('function');
  });

  test('getAction returns correct handler for PR_APPROVE:pull_request', () => {
    const handler = getAction('PR_APPROVE', 'pull_request');
    
    expect(handler).toBeDefined();
    expect(handler.action).toBe('PR_APPROVE');
    expect(handler.target).toBe('pull_request');
    expect(handler.description).toBeDefined();
    expect(typeof handler.validate).toBe('function');
    expect(typeof handler.execute).toBe('function');
  });

  test('getAction throws error for unknown action:target combinations', () => {
    expect(() => getAction('UNKNOWN_ACTION', 'repository')).toThrow();
    expect(() => getAction('ADD_ADMIN', 'unknown_target')).toThrow();
    expect(() => getAction('PR_APPROVE', 'repository')).toThrow();
    
    // Check that error message includes available actions
    let errorMessage = '';
    try {
      getAction('UNKNOWN_ACTION', 'repository');
    } catch (error) {
      errorMessage = (error as Error).message;
    }
    
    expect(errorMessage).toContain('Unknown action: UNKNOWN_ACTION:repository');
    expect(errorMessage).toContain('Available:');
    expect(errorMessage).toContain('PR_APPROVE:pull_request');
    expect(errorMessage).toContain('ADD_ADMIN:repository');
    expect(errorMessage).toContain('REMOVE_ADMIN:repository');
  });

  test('getAvailableActions returns array with all registered actions', () => {
    const actions = getAvailableActions();
    
    expect(Array.isArray(actions)).toBe(true);
    expect(actions).toHaveLength(3);
    expect(actions).toContain('PR_APPROVE:pull_request');
    expect(actions).toContain('ADD_ADMIN:repository');
    expect(actions).toContain('REMOVE_ADMIN:repository');
  });

  test('getActionMetadata returns metadata objects for all handlers', () => {
    const metadata = getActionMetadata();
    
    expect(Array.isArray(metadata)).toBe(true);
    expect(metadata).toHaveLength(3);
    
    // Should have metadata for all actions
    const addAdminMeta = metadata.find(m => m.action === 'ADD_ADMIN');
    expect(addAdminMeta).toBeDefined();
    expect(addAdminMeta?.target).toBe('repository');
    expect(addAdminMeta?.description).toBeDefined();
    
    const removeAdminMeta = metadata.find(m => m.action === 'REMOVE_ADMIN');
    expect(removeAdminMeta).toBeDefined();
    expect(removeAdminMeta?.target).toBe('repository');
    expect(removeAdminMeta?.description).toBeDefined();
    
    const mergePRMeta = metadata.find(m => m.action === 'PR_APPROVE');
    expect(mergePRMeta).toBeDefined();
    expect(mergePRMeta?.target).toBe('pull_request');
    expect(mergePRMeta?.description).toBeDefined();
  });
});