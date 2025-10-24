// Simple ADD_ADMIN Core Logic Tests
import { Octokit } from 'octokit';

import { addAdminAction } from '../../src/core/action_execution/actions/add-admin';
import { ExecContext } from '../../src/core/action_execution/context';
import { Signal } from '../../src/core/signal/signal';

// Mock external dependencies
jest.mock('../../src/services/github', () => ({
  addAdmin: jest.fn()
}));

import { addAdmin } from '../../src/services/github';

describe('ADD_ADMIN Core Logic', () => {
  let mockContext: jest.Mocked<ExecContext>;
  let mockOctokit: jest.Mocked<Octokit>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockLogger: any;

  const createValidSignal = (): Signal => ({
    dao: '0x123',
    chainId: BigInt(11155111),
    vcs: 'github',
    repoUrl: 'https://github.com/derekg1729/test-repo',
    action: 'grant',
    target: 'collaborator',
    resource: 'cogni-test-user', // username in resource field
    nonce: BigInt(1),
    deadline: Date.now() + 300000, // 5 minutes from now
    paramsJson: '{}',
    executor: '0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5'
  });

  beforeEach(() => {
    mockOctokit = {} as jest.Mocked<Octokit>;
    mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    
    mockContext = {
      repoRef: {
        host: 'github.com',
        owner: 'derekg1729',
        name: 'test-repo',
        fullName: 'derekg1729/test-repo'
      },
      provider: 'github',
      octokit: mockOctokit,
      logger: mockLogger,
      executor: '0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5',
      params: {}
    } as jest.Mocked<ExecContext>;
    
    jest.clearAllMocks();
  });

  test('validates valid ADD_ADMIN request', async () => {
    (addAdmin as jest.Mock).mockResolvedValue({
      success: true,
      status: 201,
      username: 'cogni-test-user',
      permission: 'admin'
    });

    const signal = createValidSignal();
    const result = await addAdminAction.run(signal, mockContext);

    expect(result.success).toBe(true);
    expect(result.action).toBe('admin_added');
  });

  test('executes ADD_ADMIN successfully', async () => {
    (addAdmin as jest.Mock).mockResolvedValue({
      success: true,
      status: 201, // 201 = user added as new collaborator
      username: 'cogni-test-user',
      permission: 'admin'
    });

    const signal = createValidSignal();
    const result = await addAdminAction.run(signal, mockContext);

    expect(result.success).toBe(true);
    expect(result.action).toBe('admin_added');
    expect(result.username).toBe('cogni-test-user');
    expect(result.repoUrl).toBe('https://github.com/derekg1729/test-repo');

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

    const signal = createValidSignal();
    const result = await addAdminAction.run(signal, mockContext);

    // Should still report success even if user was already admin
    expect(result.success).toBe(true);
    expect(result.action).toBe('admin_added');
    expect(result.username).toBe('cogni-test-user');
  });
});