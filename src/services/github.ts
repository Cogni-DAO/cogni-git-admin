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

export async function removeAdmin(octokit: Octokit, repo: string, username: string, executor: string) {
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
  
  console.log(`Attempting Remove Admin: checking for active collaborator and pending invitations`);
  console.log(`Repository: ${owner}/${repoName}, Username: ${username}, Executor: ${executor}`);
  
  let collaboratorRemoved = false;
  let invitationCancelled = false;
  
  try {
    // Step 1: Try to remove active collaborator
    console.log(`Attempting to remove active collaborator: /repos/${owner}/${repoName}/collaborators/${username}`);
    const collaboratorResult = await octokit.request({
      method: "DELETE",
      url: `/repos/${owner}/${repoName}/collaborators/${username}`
    });
    
    collaboratorRemoved = true;
    console.log(`Active collaborator removal SUCCESS:`, {
      repo: `${owner}/${repoName}`,
      username,
      status: collaboratorResult.status,
      executor
    });
    
  } catch (collaboratorError: unknown) {
    const errorStatus = (collaboratorError as { status?: number })?.status;
    
    // 404 means user is not an active collaborator - this is expected if they're only invited
    if (errorStatus === 404) {
      console.log(`No active collaborator found (404) - checking for pending invitation`);
    } else {
      console.log(`Failed to remove active collaborator:`, {
        error: collaboratorError instanceof Error ? collaboratorError.message : 'Unknown error',
        status: errorStatus
      });
    }
  }
  
  try {
    // Step 2: Check for and cancel pending invitations
    console.log(`Checking for pending invitations: /repos/${owner}/${repoName}/invitations`);
    const invitationsResult = await octokit.request({
      method: "GET",
      url: `/repos/${owner}/${repoName}/invitations`
    });
    
    // Find invitation for this user
    const userInvitation = invitationsResult.data.find((invitation: any) => 
      invitation.invitee?.login === username
    );
    
    if (userInvitation) {
      console.log(`Found pending invitation ID ${userInvitation.id} for ${username}`);
      
      // Cancel the invitation
      await octokit.request({
        method: "DELETE", 
        url: `/repos/${owner}/${repoName}/invitations/${userInvitation.id}`
      });
      
      invitationCancelled = true;
      console.log(`Pending invitation cancellation SUCCESS:`, {
        repo: `${owner}/${repoName}`,
        username,
        invitationId: userInvitation.id,
        executor
      });
    } else {
      console.log(`No pending invitation found for ${username}`);
    }
    
  } catch (invitationError: unknown) {
    console.log(`Failed to process invitations:`, {
      error: invitationError instanceof Error ? invitationError.message : 'Unknown error',
      status: (invitationError as { status?: number })?.status
    });
  }
  
  // Determine overall result
  if (collaboratorRemoved || invitationCancelled) {
    const actions = [];
    if (collaboratorRemoved) actions.push('removed active collaborator');
    if (invitationCancelled) actions.push('cancelled pending invitation');
    
    console.log(`Remove Admin SUCCESS: ${actions.join(' and ')}`, {
      repo: `${owner}/${repoName}`,
      username,
      collaboratorRemoved,
      invitationCancelled,
      executor
    });
    
    return {
      success: true,
      username,
      status: 204, // GitHub standard for successful deletion
      collaboratorRemoved,
      invitationCancelled
    };
  } else {
    const errorMessage = `User ${username} not found as active collaborator or pending invitation`;
    console.log(`Remove Admin FAILED: ${errorMessage}`, {
      repo: `${owner}/${repoName}`,
      username,
      executor
    });
    
    return {
      success: false,
      error: errorMessage,
      status: 404
    };
  }
}