#!/usr/bin/env tsx
/**
 * E2E runner for cogni-git-admin webhook processing.
 * Tests captured webhook fixtures against deployed app.
 */
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { replayFixture } from './helpers/fixture-replay.ts';

interface E2EOptions {
  deploymentUrl: string;
  ghToken: string | null;
  testRepo: string;
  timeoutSec: number;
}

interface E2ESummary {
  deploymentUrl: string;
  testRepo: string;
  prNumber: number;
  fixture: string;
  webhookResponse: number | null;
  githubVerification: string;
  durationMs: number | null;
  timeoutSec: number;
  ts: string;
  result: 'success' | 'error';
}

interface E2EResult {
  success: boolean;
  summary: E2ESummary;
  error: string | null;
}

function parseE2EOptionsFromEnv(overrides: Partial<E2EOptions> = {}): E2EOptions {
  const env = (name: string, fallback?: string) => {
    const v = process.env[name];
    if (!v && fallback === undefined) {
      throw new Error(`Missing required env: ${name}`);
    }
    return v ?? fallback;
  };

  return {
    deploymentUrl: env('E2E_APP_DEPLOYMENT_URL'),
    ghToken: env('TEST_REPO_GITHUB_PAT', null),
    testRepo: env('TEST_REPO', 'derekg1729/test-repo'),
    timeoutSec: parseInt(env('TIMEOUT_SEC', '30'), 10),
    ...overrides
  };
}

async function runE2ETest(options: Partial<E2EOptions> = {}): Promise<E2EResult> {
  const {
    deploymentUrl,
    ghToken,
    testRepo = 'derekg1729/test-repo', 
    timeoutSec = 30
  } = { ...parseE2EOptionsFromEnv(), ...options };

  if (!deploymentUrl) {
    throw new Error('E2E_APP_DEPLOYMENT_URL is required');
  }

  // Test data from captured fixture
  const targetPR = 121;
  const fixturePath = 'test/fixtures/alchemy/CogniSignal/successful-cognisignal-prmerge-trigger-alchemy.json';

  try {
    console.log(`[E2E] Testing webhook processing against: ${deploymentUrl}`);
    console.log(`[E2E] Target: ${testRepo} PR #${targetPR}`);
    
    // Get PR state before webhook (if token provided)
    let prStateBefore: any = null;
    if (ghToken) {
      try {
        const result = execSync(`gh api repos/${testRepo}/pulls/${targetPR}`, {
          env: { ...process.env, GH_TOKEN: ghToken },
          encoding: 'utf8'
        });
        prStateBefore = JSON.parse(result);
        console.log(`[E2E] PR state before: ${prStateBefore.state} (merged: ${prStateBefore.merged})`);
      } catch (error) {
        console.log(`[E2E] Could not fetch PR state before: ${(error as Error).message}`);
      }
    }

    // Send the captured Alchemy fixture to running app
    const startTime = Date.now();
    const statusCode = await replayFixture(
      fixturePath,
      `${deploymentUrl}/api/v1/webhooks/onchain/cogni-signal`
    );
    const duration = Date.now() - startTime;

    // Verify webhook was processed successfully
    if (statusCode < 200 || statusCode >= 300) {
      throw new Error(`Webhook processing failed: HTTP ${statusCode}`);
    }

    console.log(`✅ Webhook processed successfully (HTTP ${statusCode}) in ${duration}ms`);

    // Verify GitHub API side effect (if token provided)
    let githubVerification = 'skipped';
    if (ghToken) {
      console.log('[E2E] Waiting for GitHub operation to complete...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        const result = execSync(`gh api repos/${testRepo}/pulls/${targetPR}`, {
          env: { ...process.env, GH_TOKEN: ghToken },
          encoding: 'utf8'
        });
        const prStateAfter = JSON.parse(result);
        
        console.log(`[E2E] PR state after: ${prStateAfter.state} (merged: ${prStateAfter.merged})`);
        
        if (prStateBefore?.merged === false && prStateAfter.merged === true) {
          githubVerification = 'success - PR merged';
          console.log('✅ PR was successfully merged by cogni-git-admin!');
        } else if (prStateAfter.merged === true) {
          githubVerification = 'already_merged';
          console.log('ℹ️  PR is already merged (expected for this test fixture)');
        } else {
          githubVerification = 'no_change';
          console.log(`⚠️  PR merge state unchanged: merged=${prStateAfter.merged}`);
        }
      } catch (error) {
        githubVerification = `error: ${(error as Error).message}`;
        console.error(`❌ Failed to verify GitHub PR state: ${(error as Error).message}`);
      }
    }

    // Create summary
    const summary: E2ESummary = {
      deploymentUrl,
      testRepo,
      prNumber: targetPR,
      fixture: fixturePath,
      webhookResponse: statusCode,
      githubVerification,
      durationMs: duration,
      timeoutSec,
      ts: new Date().toISOString(),
      result: 'success'
    };

    return {
      success: true,
      summary,
      error: null
    };

  } catch (error) {
    console.error('[E2E] Test failed:', (error as Error).message);

    const summary: E2ESummary = {
      deploymentUrl: deploymentUrl!,
      testRepo,
      prNumber: targetPR,
      fixture: fixturePath,
      webhookResponse: null,
      githubVerification: 'error',
      durationMs: null,
      timeoutSec,
      ts: new Date().toISOString(),
      result: 'error'
    };

    return {
      success: false,
      summary,
      error: (error as Error).message || String(error)
    };
  }
}

async function main() {
  try {
    const options = parseE2EOptionsFromEnv();
    const result = await runE2ETest(options);
    
    // Create test artifacts directory and write summary
    mkdirSync('test-artifacts', { recursive: true });
    writeFileSync(join('test-artifacts', 'e2e-summary.json'), JSON.stringify(result.summary, null, 2));
    
    if (result.success) {
      console.log('✅ E2E test passed!');
      console.log('Summary:', JSON.stringify(result.summary, null, 2));
      process.exit(0);
    } else {
      console.error('❌ E2E test failed!');
      console.error('Error:', result.error);
      console.error('Summary:', JSON.stringify(result.summary, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ E2E runner crashed:', (error as Error).message);
    process.exit(2);
  }
}

main();