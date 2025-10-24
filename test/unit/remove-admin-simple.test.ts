// Simple REMOVE_ADMIN Core Logic Tests
import { removeAdminAction } from '../../src/core/action_execution/actions/remove-admin';
import { ExecContext } from '../../src/core/action_execution/context';
import { Signal } from '../../src/core/signal/signal';

describe('REMOVE_ADMIN Core Logic', () => {
  let mockContext: jest.Mocked<ExecContext>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockLogger: any;

  const createValidSignal = (): Signal => ({
    dao: '0x123',
    chainId: BigInt(11155111),
    vcs: 'github',
    repoUrl: 'https://github.com/derekg1729/test-repo',
    action: 'revoke',
    target: 'collaborator',
    resource: 'cogni-test-user', // username in resource field
    nonce: BigInt(1),
    deadline: Date.now() + 300000, // 5 minutes from now
    paramsJson: '{}',
    executor: '0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5'
  });

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    
    mockContext = {
      repoRef: {
        host: 'github.com',
        owner: 'derekg1729',
        repo: 'test-repo',
        url: 'https://github.com/derekg1729/test-repo'
      },
      provider: {
        mergeChange: jest.fn(),
        grantCollaborator: jest.fn(),
        revokeCollaborator: jest.fn()
      },
      logger: mockLogger,
      executor: '0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5',
      params: {}
    } as jest.Mocked<ExecContext>;
    
    jest.clearAllMocks();
  });

  test('validates valid REMOVE_ADMIN request', async () => {
    // Mock successful collaborator removal via provider
    (mockContext.provider.revokeCollaborator as jest.Mock).mockResolvedValue({
      success: true,
      status: 204,
      username: 'cogni-test-user',
      operation: 'collaborator_removed'
    });

    const signal = createValidSignal();
    const result = await removeAdminAction.run(signal, mockContext);

    expect(result.success).toBe(true);
    expect(result.action).toBe('admin_removed');
    expect(mockContext.provider.revokeCollaborator).toHaveBeenCalledWith(
      mockContext.repoRef,
      'cogni-test-user',
      {}
    );
  });

  test('executes REMOVE_ADMIN successfully', async () => {
    (mockContext.provider.revokeCollaborator as jest.Mock).mockResolvedValue({
      success: true,
      status: 204,
      username: 'cogni-test-user',
      operation: 'collaborator_removed'
    });

    const signal = createValidSignal();
    const result = await removeAdminAction.run(signal, mockContext);

    expect(result.success).toBe(true);
    expect(result.action).toBe('admin_removed');
    expect(result.username).toBe('cogni-test-user');
    expect(result.repoUrl).toBe('https://github.com/derekg1729/test-repo');
  });

  test('handles failed REMOVE_ADMIN', async () => {
    (mockContext.provider.revokeCollaborator as jest.Mock).mockResolvedValue({
      success: false,
      error: 'User not found',
      status: 404
    });

    const signal = createValidSignal();
    const result = await removeAdminAction.run(signal, mockContext);

    expect(result.success).toBe(false);
    expect(result.action).toBe('admin_remove_failed');
    expect(result.error).toBe('User not found');
    expect(result.username).toBe('cogni-test-user');
  });
});