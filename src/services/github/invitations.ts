/**
 * GitHub Invitations Service
 * 
 * Handles repository invitation management with proper error handling and type safety.
 */
import { RequestError } from '@octokit/request-error';
import type { Endpoints } from '@octokit/types';
import type { Octokit } from 'octokit';

type ListInvitationsResponse = Endpoints['GET /repos/{owner}/{repo}/invitations']['response'];

type InvitationParams = {
  owner: string;
  repo: string;
};

type CancelInvitationParams = InvitationParams & {
  invitation_id: number;
};

export type ListInvitationsResult = 
  | { ok: true; data: ListInvitationsResponse['data']; status: number }
  | { ok: false; code: number; reason: string; requestId?: string };

export type CancelInvitationResult = 
  | { ok: true; status: number }
  | { ok: false; code: number; reason: string; requestId?: string };

export async function listInvitations(
  octokit: Octokit, 
  params: InvitationParams
): Promise<ListInvitationsResult> {
  try {
    // Use paginate to handle potential pagination of invitations
    const invitations = await octokit.paginate(
      'GET /repos/{owner}/{repo}/invitations', 
      params
    );
    
    console.log(`List Invitations SUCCESS:`, {
      repo: `${params.owner}/${params.repo}`,
      count: invitations.length
    });
    
    return { 
      ok: true, 
      data: invitations,
      status: 200 
    };
  } catch (error) {
    let code = 500;
    let reason = 'unknown_error';
    let requestId: string | undefined;
    
    if (error instanceof RequestError) {
      code = error.status ?? 500;
      reason = error.message;
      requestId = error.response?.headers['x-request-id'] as string;
    }
    
    console.log(`List Invitations FAILED:`, {
      repo: `${params.owner}/${params.repo}`,
      error: reason,
      code,
      requestId
    });
    
    return { ok: false, code, reason, requestId };
  }
}

export async function cancelInvitation(
  octokit: Octokit, 
  params: CancelInvitationParams
): Promise<CancelInvitationResult> {
  try {
    if (!params.invitation_id || params.invitation_id <= 0) {
      throw new Error('Invitation ID must be a positive number');
    }
    
    const response = await octokit.request('DELETE /repos/{owner}/{repo}/invitations/{invitation_id}', params);
    
    console.log(`Cancel Invitation SUCCESS:`, {
      repo: `${params.owner}/${params.repo}`,
      invitationId: params.invitation_id,
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
    
    console.log(`Cancel Invitation FAILED:`, {
      repo: `${params.owner}/${params.repo}`,
      invitationId: params.invitation_id,
      error: reason,
      code,
      requestId
    });
    
    return { ok: false, code, reason, requestId };
  }
}