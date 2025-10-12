// Simple REMOVE_ADMIN Core Logic Tests
import { removeAdminAction } from '../../src/core/action_execution/actions/remove-admin';
import { CogniActionParsed } from '../../src/core/action_execution/types';
import { Octokit } from 'octokit';
import { Application } from 'probot';

// Mock external dependencies
jest.mock('../../src/services/github', () => ({
  removeAdmin: jest.fn()
}));

import { removeAdmin } from '../../src/services/github';

describe('REMOVE_ADMIN Core Logic', () => {
  let mockOctokit: jest.Mocked<Octokit>;
  let mockLogger: jest.Mocked<Application['log']>;

  const createValidParsed = (): CogniActionParsed => ({
    dao: '0x123',
    chainId: BigInt(11155111),
    repo: 'derekg1729/test-repo',
    action: 'REMOVE_ADMIN',
    target: 'repository',
    pr: 0,
    commit: '0x0000000000000000000000000000000000000000000000000000000000000000',
    extra: Buffer.from('cogni-1729').toString('hex'), // hex encoding of "cogni-1729"
    executor: '0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5'
  });

  beforeEach(() => {
    mockOctokit = {} as any;
    mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    } as any;
    jest.clearAllMocks();
  });

  test('validates valid REMOVE_ADMIN request', async () => {
    const parsed = createValidParsed();
    const result = await removeAdminAction.validate(parsed);
    
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('validates invalid repo format', async () => {
    const parsed = createValidParsed();
    parsed.repo = 'invalid-repo';
    
    const result = await removeAdminAction.validate(parsed);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Repo must be in format "owner/repo"');
  });

  test('validates missing username in extra data', async () => {
    const parsed = createValidParsed();
    parsed.extra = '';
    
    const result = await removeAdminAction.validate(parsed);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Username required in extra data');
  });

  test('validates invalid GitHub username format', async () => {
    const parsed = createValidParsed();
    parsed.extra = Buffer.from('invalid_user@name!').toString('hex');
    
    const result = await removeAdminAction.validate(parsed);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid GitHub username format: invalid_user@name!');
  });

  test('executes REMOVE_ADMIN successfully', async () => {
    (removeAdmin as jest.Mock).mockResolvedValue({
      success: true,
      status: 204, // 204 = user removed successfully
      username: 'cogni-1729'
    });

    const parsed = createValidParsed();
    const result = await removeAdminAction.execute(parsed, mockOctokit, mockLogger);

    expect(result.success).toBe(true);
    expect(result.action).toBe('admin_removed');
    expect(result.username).toBe('cogni-1729');
    expect(result.repo).toBe('derekg1729/test-repo');
    
    expect(removeAdmin).toHaveBeenCalledWith(
      mockOctokit,
      'derekg1729/test-repo',
      'cogni-1729',
      '0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5'
    );
  });

  test('handles REMOVE_ADMIN failure', async () => {
    (removeAdmin as jest.Mock).mockResolvedValue({
      success: false,
      error: 'User not found',
      status: 404
    });

    const parsed = createValidParsed();
    const result = await removeAdminAction.execute(parsed, mockOctokit, mockLogger);

    expect(result.success).toBe(false);
    expect(result.action).toBe('admin_remove_failed');
    expect(result.error).toBe('User not found');
    expect(result.username).toBe('cogni-1729');
    expect(result.repo).toBe('derekg1729/test-repo');
  });

  test('handles username decoding failure (empty result)', async () => {
    (removeAdmin as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Username cannot be empty',
      status: 400
    });

    const parsed = createValidParsed();
    parsed.extra = 'invalid-hex-data'; // Results in empty string after decoding
    
    const result = await removeAdminAction.execute(parsed, mockOctokit, mockLogger);

    expect(result.success).toBe(false);
    expect(result.action).toBe('admin_remove_failed');
    expect(result.error).toBe('Username cannot be empty');
  });
});