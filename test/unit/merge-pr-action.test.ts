// Merge PR Action Tests
import { mergePRAction } from '../../src/core/action_execution/actions/merge-pr';
import { CogniActionParsed } from '../../src/core/action_execution/types';
import { Octokit } from 'octokit';
import { Application } from 'probot';

// Mock external dependency
jest.mock('../../src/services/github', () => ({
  mergePR: jest.fn()
}));

import { mergePR } from '../../src/services/github';

describe('Merge PR Action', () => {
  let mockOctokit: jest.Mocked<Octokit>;
  let mockLogger: jest.Mocked<Application['log']>;

  const createValidParsed = (): CogniActionParsed => ({
    dao: '0x123',
    chainId: BigInt(11155111),
    repo: 'derekg1729/test-repo',
    action: 'PR_APPROVE',
    target: 'pull_request',
    pr: 5,
    commit: '0x0000000000000000000000000000000000000000000000000000000000000000',
    extra: Buffer.from('').toString('hex'),
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

  describe('validate', () => {
    test('validates valid PR_APPROVE request with PR number', async () => {
      const parsed = createValidParsed();
      const result = await mergePRAction.validate(parsed);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('rejects invalid cases - missing PR number', async () => {
      const parsed = { ...createValidParsed(), pr: 0 };
      const result = await mergePRAction.validate(parsed);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('PR number must be greater than 0');
    });

    test('rejects invalid cases - negative PR number', async () => {
      const parsed = { ...createValidParsed(), pr: -1 };
      const result = await mergePRAction.validate(parsed);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('PR number must be greater than 0');
    });

    test('rejects invalid cases - invalid repo format', async () => {
      const parsed = { ...createValidParsed(), repo: 'invalid-repo-format' };
      const result = await mergePRAction.validate(parsed);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Repo must be in format "owner/repo"');
    });
  });

  describe('execute', () => {
    test('executes PR merge successfully', async () => {
      (mergePR as jest.Mock).mockResolvedValue({
        success: true,
        sha: 'abc123def456',
        status: 200
      });

      const parsed = createValidParsed();
      const result = await mergePRAction.execute(parsed, mockOctokit, mockLogger);

      expect(result.success).toBe(true);
      expect(result.action).toBe('merge_completed');
      expect(result.sha).toBe('abc123def456');
      expect(result.repo).toBe('derekg1729/test-repo');
      expect(result.pr).toBe(5);
      
      expect(mergePR).toHaveBeenCalledWith(
        mockOctokit,
        'derekg1729/test-repo',
        5,
        '0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5'
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Executing PR_APPROVE for repo=derekg1729/test-repo, pr=5, executor=0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Successfully merged PR #5 in derekg1729/test-repo',
        { sha: 'abc123def456' }
      );
    });

    test('handles failed PR merge', async () => {
      (mergePR as jest.Mock).mockResolvedValue({
        success: false,
        error: 'PR cannot be merged - conflicts detected',
        status: 409
      });

      const parsed = createValidParsed();
      const result = await mergePRAction.execute(parsed, mockOctokit, mockLogger);

      expect(result.success).toBe(false);
      expect(result.action).toBe('merge_failed');
      expect(result.error).toBe('PR cannot be merged - conflicts detected');
      expect(result.repo).toBe('derekg1729/test-repo');
      expect(result.pr).toBe(5);
      
      expect(mergePR).toHaveBeenCalledWith(
        mockOctokit,
        'derekg1729/test-repo',
        5,
        '0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to merge PR #5 in derekg1729/test-repo',
        { error: 'PR cannot be merged - conflicts detected', status: 409 }
      );
    });
  });
});