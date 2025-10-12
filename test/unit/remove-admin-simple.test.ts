// Simple REMOVE_ADMIN Core Logic Tests
import { Octokit } from 'octokit';

import { removeAdminAction } from '../../src/core/action_execution/actions/remove-admin';
import { CogniActionParsed } from '../../src/core/action_execution/types';

// Mock external dependencies
jest.mock('../../src/services/github', () => ({
  removeCollaborator: jest.fn(),
  listInvitations: jest.fn(),
  cancelInvitation: jest.fn()
}));

import { cancelInvitation,listInvitations, removeCollaborator } from '../../src/services/github';

describe('REMOVE_ADMIN Core Logic', () => {
  let mockOctokit: jest.Mocked<Octokit>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockLogger: any;

  const createValidParsed = (): CogniActionParsed => ({
    dao: '0x123',
    chainId: BigInt(11155111),
    repo: 'derekg1729/test-repo',
    action: 'REMOVE_ADMIN',
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
      error: jest.fn(),
      warn: jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  test('executes REMOVE_ADMIN successfully - removes active collaborator', async () => {
    (removeCollaborator as jest.Mock).mockResolvedValue({
      success: true,
      status: 204,
      username: 'cogni-test-user'
    });

    (listInvitations as jest.Mock).mockResolvedValue({
      success: true,
      status: 200,
      invitations: [] // No pending invitations
    });

    const parsed = createValidParsed();
    const result = await removeAdminAction.execute(parsed, mockOctokit, mockLogger);

    expect(result.success).toBe(true);
    expect(result.action).toBe('admin_removed');
    expect(result.username).toBe('cogni-test-user');
    expect(result.repo).toBe('derekg1729/test-repo');
    expect(result.collaboratorRemoved).toBe(true);
    expect(result.invitationCancelled).toBe(false);

    expect(removeCollaborator).toHaveBeenCalledWith(
      mockOctokit,
      'derekg1729/test-repo',
      'cogni-test-user',
      '0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5'
    );
    expect(listInvitations).toHaveBeenCalled();
  });

  test('executes REMOVE_ADMIN successfully - cancels pending invitation', async () => {
    (removeCollaborator as jest.Mock).mockResolvedValue({
      success: false,
      status: 404,
      error: 'Not Found'
    });

    (listInvitations as jest.Mock).mockResolvedValue({
      success: true,
      status: 200,
      invitations: [
        {
          id: 123,
          invitee: { login: 'cogni-test-user' },
          permissions: 'admin'
        }
      ]
    });

    (cancelInvitation as jest.Mock).mockResolvedValue({
      success: true,
      status: 204,
      invitationId: 123
    });

    const parsed = createValidParsed();
    const result = await removeAdminAction.execute(parsed, mockOctokit, mockLogger);

    expect(result.success).toBe(true);
    expect(result.action).toBe('admin_removed');
    expect(result.username).toBe('cogni-test-user');
    expect(result.repo).toBe('derekg1729/test-repo');
    expect(result.collaboratorRemoved).toBe(false);
    expect(result.invitationCancelled).toBe(true);

    expect(removeCollaborator).toHaveBeenCalled();
    expect(listInvitations).toHaveBeenCalled();
    expect(cancelInvitation).toHaveBeenCalledWith(mockOctokit, 'derekg1729/test-repo', 123, '0xa38d03Ea38c45C1B6a37472d8Df78a47C1A31EB5');
  });

  test('executes REMOVE_ADMIN successfully - removes collaborator and cancels invitation', async () => {
    (removeCollaborator as jest.Mock).mockResolvedValue({
      success: true,
      status: 204,
      username: 'cogni-test-user'
    });

    // Even though collaborator was removed, still check for invitations
    (listInvitations as jest.Mock).mockResolvedValue({
      success: true,
      status: 200,
      invitations: [
        {
          id: 456,
          invitee: { login: 'cogni-test-user' },
          permissions: 'admin'
        }
      ]
    });

    (cancelInvitation as jest.Mock).mockResolvedValue({
      success: true,
      status: 204,
      invitationId: 456
    });

    const parsed = createValidParsed();
    const result = await removeAdminAction.execute(parsed, mockOctokit, mockLogger);

    expect(result.success).toBe(true);
    expect(result.action).toBe('admin_removed');
    expect(result.username).toBe('cogni-test-user');
    expect(result.repo).toBe('derekg1729/test-repo');
    expect(result.collaboratorRemoved).toBe(true);
    expect(result.invitationCancelled).toBe(true);
  });

  test('handles REMOVE_ADMIN failure - user not found', async () => {
    (removeCollaborator as jest.Mock).mockResolvedValue({
      success: false,
      status: 404,
      error: 'Not Found'
    });

    (listInvitations as jest.Mock).mockResolvedValue({
      success: true,
      status: 200,
      invitations: [] // No invitations found
    });

    const parsed = createValidParsed();
    const result = await removeAdminAction.execute(parsed, mockOctokit, mockLogger);

    expect(result.success).toBe(false);
    expect(result.action).toBe('admin_remove_failed');
    expect(result.error).toBe('User cogni-test-user not found as active collaborator or pending invitation');
    expect(result.username).toBe('cogni-test-user');
    expect(result.repo).toBe('derekg1729/test-repo');
  });

  test('handles username decoding failure (empty result)', async () => {
    (removeCollaborator as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Username cannot be empty',
      status: 400
    });

    (listInvitations as jest.Mock).mockResolvedValue({
      success: true,
      status: 200,
      invitations: [] // No invitations found
    });

    const parsed = createValidParsed();
    parsed.extra = 'invalid-hex-data'; // Results in empty string after decoding

    const result = await removeAdminAction.execute(parsed, mockOctokit, mockLogger);

    expect(result.success).toBe(false);
    expect(result.action).toBe('admin_remove_failed');
    expect(result.error).toBe('User  not found as active collaborator or pending invitation');
  });
});