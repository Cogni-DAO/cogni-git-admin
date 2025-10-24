// Simple REMOVE_ADMIN Core Logic Tests
import { Octokit } from 'octokit';

import { removeAdminAction } from '../../src/core/action_execution/actions/remove-admin';
import { ExecContext } from '../../src/core/action_execution/context';
import { Signal } from '../../src/core/signal/signal';

// Mock external dependencies
jest.mock('../../src/services/github', () => ({
  removeCollaborator: jest.fn(),
  listInvitations: jest.fn(),
  cancelInvitation: jest.fn()
}));

import { cancelInvitation,listInvitations, removeCollaborator } from '../../src/services/github';

describe('REMOVE_ADMIN Core Logic', () => {
  let mockContext: jest.Mocked<ExecContext>;
  let mockOctokit: jest.Mocked<Octokit>;
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
    mockOctokit = {} as jest.Mocked<Octokit>;
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

  test('validates valid REMOVE_ADMIN request', async () => {
    // Mock successful collaborator removal
    (removeCollaborator as jest.Mock).mockResolvedValue({
      success: true,
      status: 204
    });
    (listInvitations as jest.Mock).mockResolvedValue({
      success: true,
      invitations: []
    });

    const signal = createValidSignal();
    const result = await removeAdminAction.run(signal, mockContext);

    expect(result.success).toBe(true);
    expect(result.action).toBe('admin_removed');
  });

  test('validates invalid username', async () => {
    const signal = { ...createValidSignal(), resource: '' }; // empty username

    const result = await removeAdminAction.run(signal, mockContext);

    expect(result.success).toBe(false);
    expect(result.action).toBe('validation_failed');
    expect(result.error).toBe('Username required in resource field');
  });

  test('validates missing username in resource data', async () => {
    const signal = { ...createValidSignal(), resource: '' };

    const result = await removeAdminAction.run(signal, mockContext);

    expect(result.success).toBe(false);
    expect(result.action).toBe('validation_failed');
    expect(result.error).toBe('Username required in resource field');
  });

  test('validates invalid GitHub username format', async () => {
    const signal = { ...createValidSignal(), resource: 'invalid_user@name!' };

    const result = await removeAdminAction.run(signal, mockContext);

    expect(result.success).toBe(false);
    expect(result.action).toBe('validation_failed');
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

    const signal = createValidSignal();
    const result = await removeAdminAction.run(signal, mockContext);

    expect(result.success).toBe(true);
    expect(result.action).toBe('admin_removed');
    expect(result.username).toBe('cogni-test-user');
    expect(result.repoUrl).toBe('https://github.com/derekg1729/test-repo');
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

    const signal = createValidSignal();
    const result = await removeAdminAction.run(signal, mockContext);

    expect(result.success).toBe(true);
    expect(result.action).toBe('admin_removed');
    expect(result.username).toBe('cogni-test-user');
    expect(result.repoUrl).toBe('https://github.com/derekg1729/test-repo');
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

    const signal = createValidSignal();
    const result = await removeAdminAction.run(signal, mockContext);

    expect(result.success).toBe(true);
    expect(result.action).toBe('admin_removed');
    expect(result.username).toBe('cogni-test-user');
    expect(result.repoUrl).toBe('https://github.com/derekg1729/test-repo');
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

    const signal = createValidSignal();
    const result = await removeAdminAction.run(signal, mockContext);

    expect(result.success).toBe(false);
    expect(result.action).toBe('admin_remove_failed');
    expect(result.error).toBe('User cogni-test-user not found as active collaborator or pending invitation');
    expect(result.username).toBe('cogni-test-user');
    expect(result.repoUrl).toBe('https://github.com/derekg1729/test-repo');
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

    const signal = { ...createValidSignal(), resource: '' }; // empty resource results in validation failure

    const result = await removeAdminAction.run(signal, mockContext);

    expect(result.success).toBe(false);
    expect(result.action).toBe('validation_failed');
    expect(result.error).toBe('Username required in resource field');
  });
});