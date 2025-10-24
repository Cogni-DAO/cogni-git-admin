// Merge PR Action Tests
import { Octokit } from 'octokit';

import { mergePRAction } from '../../src/core/action_execution/actions/merge-pr';
import { ExecContext } from '../../src/core/action_execution/context';
import { Signal } from '../../src/core/signal/signal';

// Mock external dependency
jest.mock('../../src/services/github', () => ({
  mergePR: jest.fn()
}));

import { mergePR } from '../../src/services/github';

describe('Merge PR Action', () => {
  let mockContext: jest.Mocked<ExecContext>;
  let mockOctokit: jest.Mocked<Octokit>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockLogger: any;

  const createValidSignal = (): Signal => ({
    dao: '0x123',
    chainId: BigInt(11155111),
    vcs: 'github',
    repoUrl: 'https://github.com/derekg1729/test-repo',
    action: 'merge',
    target: 'change',
    resource: '5', // PR number as string in resource field
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

  describe('validation via run method', () => {
    test('validates valid merge request with PR number', async () => {
      (mergePR as jest.Mock).mockResolvedValue({
        success: true,
        sha: 'abc123def456',
        status: 200
      });

      const signal = createValidSignal();
      const result = await mergePRAction.run(signal, mockContext);
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('merge_completed');
    });

    test('rejects invalid cases - missing PR number', async () => {
      const signal = { ...createValidSignal(), resource: '0' };
      const result = await mergePRAction.run(signal, mockContext);
      
      expect(result.success).toBe(false);
      expect(result.action).toBe('validation_failed');
      expect(result.error).toBe('Resource must be a valid change number greater than 0');
    });

    test('rejects invalid cases - invalid PR number', async () => {
      const signal = { ...createValidSignal(), resource: 'invalid' };
      const result = await mergePRAction.run(signal, mockContext);
      
      expect(result.success).toBe(false);
      expect(result.action).toBe('validation_failed');
      expect(result.error).toBe('Resource must be a valid change number greater than 0');
    });
  });

  describe('execution via run method', () => {
    test('executes PR merge successfully', async () => {
      (mergePR as jest.Mock).mockResolvedValue({
        success: true,
        sha: 'abc123def456',
        status: 200
      });

      const signal = createValidSignal();
      const result = await mergePRAction.run(signal, mockContext);

      expect(result.success).toBe(true);
      expect(result.action).toBe('merge_completed');
      expect(result.sha).toBe('abc123def456');
      expect(result.repoUrl).toBe('https://github.com/derekg1729/test-repo');
      expect(result.changeNumber).toBe(5);
      
      expect(mergePR).toHaveBeenCalledWith(
        mockOctokit,
        'derekg1729/test-repo',
        5,
        '0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5'
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Executing merge for repoUrl=https://github.com/derekg1729/test-repo, change=5, executor=0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Successfully merged change #5 in derekg1729/test-repo',
        { sha: 'abc123def456' }
      );
    });

    test('handles failed PR merge', async () => {
      (mergePR as jest.Mock).mockResolvedValue({
        success: false,
        error: 'PR cannot be merged - conflicts detected',
        status: 409
      });

      const signal = createValidSignal();
      const result = await mergePRAction.run(signal, mockContext);

      expect(result.success).toBe(false);
      expect(result.action).toBe('merge_failed');
      expect(result.error).toBe('PR cannot be merged - conflicts detected');
      expect(result.repoUrl).toBe('https://github.com/derekg1729/test-repo');
      expect(result.changeNumber).toBe(5);
      
      expect(mergePR).toHaveBeenCalledWith(
        mockOctokit,
        'derekg1729/test-repo',
        5,
        '0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to merge change #5 in derekg1729/test-repo',
        { error: 'PR cannot be merged - conflicts detected', status: 409 }
      );
    });
  });
});