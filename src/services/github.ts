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