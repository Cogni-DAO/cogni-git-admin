import { environment } from '../../utils/env';

export function getInstallationId(dao: string, repo: string): number {
  // TODO: Replace with database lookup mapping DAO+repo to GitHub App installation ID
  // TODO: Validate that DAO has permission for this repo
  // TODO: Support multiple installations per DAO
  
  // MVP: Hardcoded mapping
  if (dao.toLowerCase() === environment.DAO_ADDRESS?.toLowerCase() && repo === 'derekg1729/test-repo') {

    // Still SUPER temporary glue code for testing purposes
    if (environment.NODE_ENV === 'production') {
      // Preview app's installation ID on test-repo
      return 89353955;
    } else {
      // Dev app's installation ID on test-repo
      return 89056469;
    }
  }
  throw new Error(`No GitHub App installation found for DAO ${dao} and repo ${repo}`);
}