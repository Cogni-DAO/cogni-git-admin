/**
 * GitHub Service - Atomic GitHub API Operations
 * 
 * This service provides 1:1 mappings to GitHub API calls.
 * Each function should map to exactly one GitHub API endpoint.
 * Complex business logic should be handled in action handlers, not here.
 * 
 * Note: currently uses Probot's Octokit instance for Github connection. 
 * In the future? maybe Github MCP
 */
import { Octokit } from 'octokit';

export async function mergePR(octokit: Octokit, repo: string, prNumber: number, executor: string) {
  // TODO: Validate repo permissions - check if DAO has access to this repo
  // TODO: Validate executor permissions - check if executor is authorized in DAO
  // TODO: Add idempotency - check if PR already merged to avoid double-merge
  
  if (!repo.includes('/')) {
    throw new Error(`Invalid repo format: ${repo}. Expected "owner/repo"`);
  }
  
  const [owner, repoName] = repo.split('/');
  
  console.log(`Attempting PR Merge: /repos/${owner}/${repoName}/pulls/${prNumber}/merge`);
  console.log(`Executor: ${executor}`);
  
  try {
    const result = await octokit.request({
      method: "PUT",
      url: `/repos/${owner}/${repoName}/pulls/${Number(prNumber)}/merge`,
      merge_method: "merge",
      commit_title: `Merge PR #${prNumber} via CogniAction`,
      commit_message: `Executed by: ${executor}`
    });
    
    console.log(`PR Merge SUCCESS:`, {
      repo: `${owner}/${repoName}`,
      pr: prNumber,
      sha: result.data.sha,
      merged: result.data.merged,
      message: result.data.message
    });
    
    return {
      success: true,
      sha: result.data.sha,
      merged: result.data.merged,
      message: result.data.message
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStatus = (error as { status?: number })?.status;
    
    console.log(`PR Merge FAILED:`, {
      repo: `${owner}/${repoName}`,
      pr: prNumber,
      error: errorMessage,
      status: errorStatus
    });
    
    return {
      success: false,
      error: errorMessage,
      status: errorStatus
    };
  }
}

export async function addAdmin(octokit: Octokit, repo: string, username: string, executor: string) {
  if (!repo.includes('/')) {
    throw new Error(`Invalid repo format: ${repo}. Expected "owner/repo"`);
  }
  
  if (!username || username.length === 0) {
    throw new Error('Username cannot be empty');
  }
  
  // Basic GitHub username validation
  if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username)) {
    throw new Error(`Invalid GitHub username format: ${username}`);
  }
  
  const [owner, repoName] = repo.split('/');
  
  console.log(`Attempting Add Admin: /repos/${owner}/${repoName}/collaborators/${username}`);
  console.log(`Executor: ${executor}`);
  
  try {
    const result = await octokit.request({
      method: "PUT",
      url: `/repos/${owner}/${repoName}/collaborators/${username}`,
      permission: "admin"
    });
    
    console.log(`Add Admin SUCCESS:`, {
      repo: `${owner}/${repoName}`,
      username,
      status: result.status,
      executor
    });
    
    return {
      success: true,
      username,
      permission: "admin",
      status: result.status
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStatus = (error as { status?: number })?.status;
    
    console.log(`Add Admin FAILED:`, {
      repo: `${owner}/${repoName}`,
      username,
      error: errorMessage,
      status: errorStatus,
      executor
    });
    
    return {
      success: false,
      error: errorMessage,
      status: errorStatus
    };
  }
}

export async function removeCollaborator(octokit: Octokit, repo: string, username: string, executor: string) {
  if (!repo.includes('/')) {
    throw new Error(`Invalid repo format: ${repo}. Expected "owner/repo"`);
  }
  
  if (!username || username.length === 0) {
    throw new Error('Username cannot be empty');
  }
  
  // Basic GitHub username validation
  if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username)) {
    throw new Error(`Invalid GitHub username format: ${username}`);
  }
  
  const [owner, repoName] = repo.split('/');
  
  console.log(`Attempting Remove Collaborator: /repos/${owner}/${repoName}/collaborators/${username}`);
  console.log(`Executor: ${executor}`);
  
  try {
    const result = await octokit.request({
      method: "DELETE",
      url: `/repos/${owner}/${repoName}/collaborators/${username}`
    });
    
    console.log(`Remove Collaborator SUCCESS:`, {
      repo: `${owner}/${repoName}`,
      username,
      status: result.status,
      executor
    });
    
    return {
      success: true,
      username,
      status: result.status
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStatus = (error as { status?: number })?.status;
    
    console.log(`Remove Collaborator FAILED:`, {
      repo: `${owner}/${repoName}`,
      username,
      error: errorMessage,
      status: errorStatus,
      executor
    });
    
    return {
      success: false,
      error: errorMessage,
      status: errorStatus
    };
  }
}

export async function listInvitations(octokit: Octokit, repo: string, executor: string) {
  if (!repo.includes('/')) {
    throw new Error(`Invalid repo format: ${repo}. Expected "owner/repo"`);
  }
  
  const [owner, repoName] = repo.split('/');
  
  console.log(`List Invitations: /repos/${owner}/${repoName}/invitations`);
  console.log(`Executor: ${executor}`);
  
  try {
    const result = await octokit.request({
      method: "GET",
      url: `/repos/${owner}/${repoName}/invitations`
    });
    
    console.log(`List Invitations SUCCESS:`, {
      repo: `${owner}/${repoName}`,
      count: result.data.length,
      executor
    });
    
    return {
      success: true,
      invitations: result.data,
      status: result.status
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStatus = (error as { status?: number })?.status;
    
    console.log(`List Invitations FAILED:`, {
      repo: `${owner}/${repoName}`,
      error: errorMessage,
      status: errorStatus,
      executor
    });
    
    return {
      success: false,
      error: errorMessage,
      status: errorStatus
    };
  }
}

export async function cancelInvitation(octokit: Octokit, repo: string, invitationId: number, executor: string) {
  if (!repo.includes('/')) {
    throw new Error(`Invalid repo format: ${repo}. Expected "owner/repo"`);
  }
  
  if (!invitationId || invitationId <= 0) {
    throw new Error('Invitation ID must be a positive number');
  }
  
  const [owner, repoName] = repo.split('/');
  
  console.log(`Cancel Invitation: /repos/${owner}/${repoName}/invitations/${invitationId}`);
  console.log(`Executor: ${executor}`);
  
  try {
    const result = await octokit.request({
      method: "DELETE", 
      url: `/repos/${owner}/${repoName}/invitations/${invitationId}`
    });
    
    console.log(`Cancel Invitation SUCCESS:`, {
      repo: `${owner}/${repoName}`,
      invitationId,
      status: result.status,
      executor
    });
    
    return {
      success: true,
      invitationId,
      status: result.status
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStatus = (error as { status?: number })?.status;
    
    console.log(`Cancel Invitation FAILED:`, {
      repo: `${owner}/${repoName}`,
      invitationId,
      error: errorMessage,
      status: errorStatus,
      executor
    });
    
    return {
      success: false,
      error: errorMessage,
      status: errorStatus
    };
  }
}