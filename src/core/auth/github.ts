export function getInstallationId(dao: string, repo: string): number {
  // TODO: Replace with database lookup mapping DAO+repo to GitHub App installation ID
  // TODO: Validate that DAO has permission for this repo
  // TODO: Support multiple installations per DAO
  
  // MVP: Hardcoded mapping
  if (dao.toLowerCase() === '0xa38d03ea38c45c1b6a37472d8df78a47c1a31eb5' && repo === 'derekg1729/test-repo') {
    return 89056469;
  }
  throw new Error(`No GitHub App installation found for DAO ${dao} and repo ${repo}`);
}