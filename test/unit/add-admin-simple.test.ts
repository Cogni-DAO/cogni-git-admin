// Simple ADD_ADMIN Core Logic Tests
import { addAdminAction } from '../../src/core/action_execution/actions/add-admin';
import { CogniActionParsed } from '../../src/core/action_execution/types';
import { Octokit } from 'octokit';

// Mock external dependencies
jest.mock('../../src/services/github', () => ({
  addAdmin: jest.fn()
}));

import { addAdmin } from '../../src/services/github';

describe('ADD_ADMIN Core Logic', () => {
  let mockOctokit: jest.Mocked<Octokit>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockLogger: any;

  const createValidParsed = (): CogniActionParsed => ({
    dao: '0x123',
    chainId: BigInt(11155111),
    repo: 'derekg1729/test-repo',
    action: 'ADD_ADMIN',
    target: 'repository',
    pr: 0,
    commit: '0x0000000000000000000000000000000000000000000000000000000000000000',
    extra: Buffer.from('cogni-test-user').toString('hex'), // hex encoding of "cogni-test-user"
    executor: '0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5'
  });

  beforeEach(() => {
    mockOctokit = {} as jest.Mocked<Octokit>;
    mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    jest.clearAllMocks();
  });

  test('validates valid ADD_ADMIN request', async () => {
    const parsed = createValidParsed();
    const result = await addAdminAction.validate(parsed);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('executes ADD_ADMIN successfully', async () => {
    (addAdmin as jest.Mock).mockResolvedValue({
      success: true,
      status: 201, // 201 = user added as new collaborator
      username: 'cogni-test-user',
      permission: 'admin'
    });

    const parsed = createValidParsed();
    const result = await addAdminAction.execute(parsed, mockOctokit, mockLogger);

    expect(result.success).toBe(true);
    expect(result.action).toBe('admin_added');
    expect(result.username).toBe('cogni-test-user');
    expect(result.repo).toBe('derekg1729/test-repo');

    expect(addAdmin).toHaveBeenCalledWith(
      mockOctokit,
      'derekg1729/test-repo',
      'cogni-test-user',
      '0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5'
    );
  });

  test('handles case where user is already admin (204 status)', async () => {
    (addAdmin as jest.Mock).mockResolvedValue({
      success: true,
      status: 204, // 204 = user already exists, no change made
      username: 'cogni-test-user',
      permission: 'admin'
    });

    const parsed = createValidParsed();
    const result = await addAdminAction.execute(parsed, mockOctokit, mockLogger);

    // Should still report success even if user was already admin
    expect(result.success).toBe(true);
    expect(result.action).toBe('admin_added');
    expect(result.username).toBe('cogni-test-user');
  });
});