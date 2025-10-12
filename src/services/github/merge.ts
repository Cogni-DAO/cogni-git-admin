/**
 * GitHub PR Merge Service
 * 
 * Handles pull request merge operations with proper error handling and type safety.
 */
import { RequestError } from '@octokit/request-error';
import type { Endpoints } from '@octokit/types';
import type { Octokit } from 'octokit';

type MergeResponse = Endpoints['PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge']['response'];
type MergeParams = {
  owner: string;
  repo: string;
  pull_number: number;
  merge_method?: 'merge' | 'squash' | 'rebase';
  commit_title?: string;
  commit_message?: string;
  sha?: string;
};

export type MergeResult = 
  | { ok: true; data: MergeResponse['data'] }
  | { ok: false; code: number; reason: string; requestId?: string };

export async function mergePR(
  octokit: Octokit, 
  params: MergeParams
): Promise<MergeResult> {
  try {
    const response = await octokit.request('PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge', {
      ...params,
      merge_method: params.merge_method ?? 'merge',
    });
    
    console.log(`PR Merge SUCCESS:`, {
      repo: `${params.owner}/${params.repo}`,
      pr: params.pull_number,
      sha: response.data.sha,
      merged: response.data.merged,
      message: response.data.message
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
    }
    
    console.log(`PR Merge FAILED:`, {
      repo: `${params.owner}/${params.repo}`,
      pr: params.pull_number,
      error: reason,
      code,
      requestId
    });
    
    return { ok: false, code, reason, requestId };
  }
}