import { mergePR } from '../../services/github';
import { Octokit } from 'octokit';
import { Application } from 'probot';

export interface CogniActionParsed {
  dao: string;
  chainId: bigint;
  repo: string;
  action: string;
  target: string;
  pr: number;
  commit: string;
  extra: string;
  executor: string;
}

export async function executeAction(parsed: CogniActionParsed, octokit: Octokit, logger: Application['log']) {
  // TODO: Add database lookup to validate DAO has permission for this repo
  // TODO: Add rate limiting per DAO/executor
  // TODO: Add audit logging to permanent storage
  
  const { action, repo, pr, executor } = parsed;
  
  // MVP: Hardcoded action mapping
  if (action === 'PR_APPROVE' && parsed.target === 'pull_request') {
    logger.info(`Executing ${action} for repo=${repo}, pr=${pr}, executor=${executor}`);
    
    const result = await mergePR(octokit, repo, pr, executor);
    
    if (result.success) {
      logger.info(`Successfully merged PR #${pr} in ${repo}`, { sha: result.sha });
      return { success: true, action: 'merge_completed', sha: result.sha };
    } else {
      logger.error(`Failed to merge PR #${pr} in ${repo}`, { error: result.error, status: result.status });
      return { success: false, action: 'merge_failed', error: result.error };
    }
  }
  
  // TODO: Add other action types (PR_REJECT, ISSUE_CLOSE, etc.)
  logger.warn(`Unsupported action: ${action} for target: ${parsed.target}`);
  return { success: false, action: 'unsupported', reason: `Action ${action} not implemented` };
}