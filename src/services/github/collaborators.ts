/**
 * GitHub Collaborators Service
 * 
 * Handles repository collaborator management with proper error handling and type safety.
 */
import { RequestError } from '@octokit/request-error';
import type { Endpoints } from '@octokit/types';
import type { Octokit } from 'octokit';

type AddCollaboratorResponse = Endpoints['PUT /repos/{owner}/{repo}/collaborators/{username}']['response'];

type CollaboratorParams = {
  owner: string;
  repo: string;
  username: string;
  permission?: 'pull' | 'triage' | 'push' | 'maintain' | 'admin';
};

export type AddCollaboratorResult = 
  | { ok: true; data: AddCollaboratorResponse['data'] }
  | { ok: false; code: number; reason: string; requestId?: string };

export type RemoveCollaboratorResult = 
  | { ok: true; status: number }
  | { ok: false; code: number; reason: string; requestId?: string };

function validateUsername(username: string): void {
  if (!username || username.length === 0) {
    throw new Error('Username cannot be empty');
  }
  
  // GitHub username validation regex
  if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username)) {
    throw new Error(`Invalid GitHub username format: ${username}`);
  }
}

export async function addAdmin(
  octokit: Octokit, 
  params: Omit<CollaboratorParams, 'permission'>
): Promise<AddCollaboratorResult> {
  try {
    validateUsername(params.username);
    
    const response = await octokit.request('PUT /repos/{owner}/{repo}/collaborators/{username}', {
      ...params,
      permission: 'admin' as const,
    });
    
    console.log(`Add Admin SUCCESS:`, {
      repo: `${params.owner}/${params.repo}`,
      username: params.username,
      status: response.status
    });
    
    return { ok: true, data: response.data };
  } catch (error) {
    let code = 500;
    let reason = 'unknown_error';
    let requestId: string | undefined;
    
    if (error instanceof RequestError) {
      code = error.status ?? 500;
      reason = error.message;
      requestId = error.response?.headers['x-request-id'] as string;
    } else if (error instanceof Error) {
      reason = error.message;
      code = 400; // Validation errors are client errors
    }
    
    console.log(`Add Admin FAILED:`, {
      repo: `${params.owner}/${params.repo}`,
      username: params.username,
      error: reason,
      code,
      requestId
    });
    
    return { ok: false, code, reason, requestId };
  }
}

export async function removeCollaborator(
  octokit: Octokit, 
  params: Pick<CollaboratorParams, 'owner' | 'repo' | 'username'>
): Promise<RemoveCollaboratorResult> {
  try {
    validateUsername(params.username);
    
    const response = await octokit.request('DELETE /repos/{owner}/{repo}/collaborators/{username}', params);
    
    console.log(`Remove Collaborator SUCCESS:`, {
      repo: `${params.owner}/${params.repo}`,
      username: params.username,
      status: response.status
    });
    
    return { ok: true, status: response.status };
  } catch (error) {
    let code = 500;
    let reason = 'unknown_error';
    let requestId: string | undefined;
    
    if (error instanceof RequestError) {
      code = error.status ?? 500;
      reason = error.message;
      requestId = error.response?.headers['x-request-id'] as string;
    } else if (error instanceof Error) {
      reason = error.message;
      code = 400; // Validation errors are client errors
    }
    
    console.log(`Remove Collaborator FAILED:`, {
      repo: `${params.owner}/${params.repo}`,
      username: params.username,
      error: reason,
      code,
      requestId
    });
    
    return { ok: false, code, reason, requestId };
  }
}