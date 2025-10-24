// Registry Functionality Tests
import { getAction, getActionMetadata,getAvailableActions } from '../../src/core/action_execution/registry';

describe('Action Registry', () => {
  test('getAction returns correct handler for grant:collaborator', () => {
    const handler = getAction('grant', 'collaborator');
    
    expect(handler).toBeDefined();
    expect(handler.action).toBe('grant');
    expect(handler.target).toBe('collaborator');
    expect(handler.description).toBeDefined();
    expect(typeof handler.run).toBe('function');
  });

  test('getAction returns correct handler for revoke:collaborator', () => {
    const handler = getAction('revoke', 'collaborator');
    
    expect(handler).toBeDefined();
    expect(handler.action).toBe('revoke');
    expect(handler.target).toBe('collaborator');
    expect(handler.description).toBeDefined();
    expect(typeof handler.run).toBe('function');
  });

  test('getAction returns correct handler for merge:change', () => {
    const handler = getAction('merge', 'change');
    
    expect(handler).toBeDefined();
    expect(handler.action).toBe('merge');
    expect(handler.target).toBe('change');
    expect(handler.description).toBeDefined();
    expect(typeof handler.run).toBe('function');
  });

  test('getAction throws error for unknown action:target combinations', () => {
    expect(() => getAction('UNKNOWN_ACTION', 'repository')).toThrow();
    expect(() => getAction('grant', 'unknown_target')).toThrow();
    expect(() => getAction('merge', 'repository')).toThrow();
    
    // Check that error message includes available actions
    let errorMessage = '';
    try {
      getAction('UNKNOWN_ACTION', 'repository');
    } catch (error) {
      errorMessage = (error as Error).message;
    }
    
    expect(errorMessage).toContain('Unknown action: UNKNOWN_ACTION:repository');
    expect(errorMessage).toContain('Available:');
    expect(errorMessage).toContain('merge:change');
    expect(errorMessage).toContain('grant:collaborator');
    expect(errorMessage).toContain('revoke:collaborator');
  });

  test('getAvailableActions returns array with all registered actions', () => {
    const actions = getAvailableActions();
    
    expect(Array.isArray(actions)).toBe(true);
    expect(actions).toHaveLength(3);
    expect(actions).toContain('merge:change');
    expect(actions).toContain('grant:collaborator');
    expect(actions).toContain('revoke:collaborator');
  });

  test('getActionMetadata returns metadata objects for all handlers', () => {
    const metadata = getActionMetadata();
    
    expect(Array.isArray(metadata)).toBe(true);
    expect(metadata).toHaveLength(3);
    
    // Should have metadata for all actions
    const grantMeta = metadata.find(m => m.action === 'grant');
    expect(grantMeta).toBeDefined();
    expect(grantMeta?.target).toBe('collaborator');
    expect(grantMeta?.description).toBeDefined();
    
    const revokeMeta = metadata.find(m => m.action === 'revoke');
    expect(revokeMeta).toBeDefined();
    expect(revokeMeta?.target).toBe('collaborator');
    expect(revokeMeta?.description).toBeDefined();
    
    const mergeMeta = metadata.find(m => m.action === 'merge');
    expect(mergeMeta).toBeDefined();
    expect(mergeMeta?.target).toBe('change');
    expect(mergeMeta?.description).toBeDefined();
  });
});