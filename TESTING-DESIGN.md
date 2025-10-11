# Testing Design: Enhanced E2E Testing with Anvil Integration

## Overview

This document outlines a comprehensive testing strategy for the cogni-git-admin system, introducing Anvil-based blockchain testing to enable proper E2E validation of the complete DAO voting → PR creation/merge workflow.

## Current Testing Landscape

### Existing Infrastructure
- **Jest**: Primary testing framework for unit and integration tests
- **Supertest**: HTTP API testing capabilities 
- **E2E Runner**: Basic smoke testing against deployed environments (`e2e/e2e-runner.ts`)
- **Fixture System**: Webhook payload capture and replay (`test/fixtures/`, `e2e/helpers/fixture-replay.ts`)
- **Probot Mocking**: GitHub webhook simulation for unit tests

### Current Limitations
- No blockchain state simulation - tests rely on captured webhook fixtures only
- Cannot test complete DAO voting workflow from transaction creation to PR merge
- No validation of smart contract interactions
- Limited error scenario testing (timeouts, reverts, invalid signatures)
- Hardcoded DAO/repo mappings prevent testing authorization logic

## Enhanced Testing Architecture

### 1. Anvil Integration Layer

**Component**: `test/blockchain/anvil-manager.ts`
```typescript
interface AnvilInstance {
  port: number;
  rpcUrl: string; 
  accounts: string[];
  cleanup: () => Promise<void>;
}

class AnvilTestManager {
  async createInstance(options?: AnvilOptions): Promise<AnvilInstance>
  async deployTestContracts(instance: AnvilInstance): Promise<ContractAddresses>  
  async simulateDAOVote(vote: DAOVoteParams): Promise<TransactionHash>
}
```

**Features**:
- Programmatic Anvil instance creation via `@viem/anvil`
- Automatic test contract deployment (CogniSignal, mock DAO contracts)
- Account management with pre-funded test wallets
- Fork mode support for testing against live contract state

### 2. Contract Testing Infrastructure

**Component**: `test/contracts/`
```
test/contracts/
├── CogniSignal.sol          # Test version of CogniSignal contract
├── MockDAO.sol              # Simplified DAO for vote simulation
├── deploy.ts                # Contract deployment utilities
└── interactions.ts          # Contract interaction helpers
```

**Capabilities**:
- Deploy CogniSignal contract to local Anvil
- Create mock DAO with voting mechanisms
- Simulate multi-step voting processes
- Test various action types (PR_APPROVE, PR_REJECT, etc.)

### 3. End-to-End Test Scenarios

**Component**: `test/e2e-enhanced/`

#### Scenario 1: Complete DAO Vote → PR Merge Flow
```typescript
test('complete DAO vote to PR merge workflow', async () => {
  // 1. Setup Anvil with deployed contracts
  const anvil = await anvilManager.createInstance();
  const contracts = await anvilManager.deployTestContracts(anvil);
  
  // 2. Create test PR in GitHub (via API)
  const pr = await createTestPR(testRepo, 'test-branch');
  
  // 3. Simulate DAO vote transaction
  const voteTx = await contracts.mockDAO.vote({
    repo: testRepo,
    action: 'PR_APPROVE', 
    prNumber: pr.number,
    executor: testWallet.address
  });
  
  // 4. Wait for webhook delivery to cogni-git-admin
  await waitForWebhookProcessing(voteTx.hash);
  
  // 5. Verify PR was merged
  const updatedPR = await github.pulls.get({ 
    owner: testOwner, 
    repo: testRepo, 
    pull_number: pr.number 
  });
  expect(updatedPR.merged).toBe(true);
});
```

#### Scenario 2: Authorization Testing
```typescript
test('unauthorized DAO cannot merge PRs', async () => {
  // Test with different DAO addresses
  // Verify rejection of unauthorized votes
  // Test repo permission boundaries
});

test('unauthorized executor cannot trigger actions', async () => {
  // Test executor validation logic
  // Verify signature validation
});
```

#### Scenario 3: Error Handling
```typescript
test('handles blockchain reorg scenarios', async () => {
  // Test transaction replacement
  // Test duplicate event handling
});

test('recovers from failed GitHub operations', async () => {
  // Test GitHub API failures
  // Test retry mechanisms
  // Test partial failure states
});
```

### 4. Integration Test Categories

#### Blockchain Integration Tests
- **Contract Deployment**: Verify correct ABI parsing and event signatures
- **Event Filtering**: Test log parsing with various contract addresses and topics
- **Provider Reliability**: Test RPC failures, timeouts, and reconnection logic
- **Signature Validation**: Test HMAC verification for different providers (Alchemy, QuickNode)

#### GitHub Integration Tests  
- **Authentication**: Test GitHub App installation ID resolution
- **API Operations**: Test PR merging, commenting, status updates
- **Webhook Processing**: Test GitHub → cogni-git-admin webhook flow
- **Rate Limiting**: Test GitHub API rate limit handling

#### Cross-System Integration
- **Latency Testing**: Test webhook delivery delays and timeouts
- **Concurrent Operations**: Test multiple DAO votes for same PR
- **State Consistency**: Test race conditions between blockchain and GitHub events

### 5. Test Data Management

#### Dynamic Test Environments
```typescript
interface TestEnvironment {
  anvil: AnvilInstance;
  contracts: DeployedContracts;
  github: MockGitHubEnvironment;
  webapp: TestWebappInstance;
}

class TestEnvironmentManager {
  async createIsolatedEnvironment(): Promise<TestEnvironment>
  async seedWithTestData(env: TestEnvironment): Promise<void>  
  async cleanup(env: TestEnvironment): Promise<void>
}
```

#### Test Data Factory
```typescript
class TestDataFactory {
  createDAOVote(overrides?: Partial<DAOVote>): DAOVote
  createPRPayload(overrides?: Partial<PRPayload>): PRPayload
  createWebhookFixture(tx: Transaction): WebhookFixture
}
```

### 6. Performance and Load Testing

#### Webhook Load Testing
```typescript
test('handles high-frequency webhook bursts', async () => {
  // Simulate rapid succession of DAO votes
  // Test webhook queue processing
  // Verify no dropped events
});
```

#### Resource Management Testing  
```typescript
test('resource cleanup under load', async () => {
  // Test memory usage patterns
  // Test database connection pooling
  // Test Anvil instance lifecycle
});
```

## Implementation Plan

### Phase 1: Foundation (Week 1-2)
- [ ] Install and configure `@viem/anvil` and `foundry`
- [ ] Create `AnvilTestManager` with basic instance management
- [ ] Create simple CogniSignal test contract
- [ ] Write first Anvil integration test (deploy + emit event)

### Phase 2: Contract Testing (Week 2-3)  
- [ ] Implement MockDAO contract with voting functionality
- [ ] Create contract deployment automation
- [ ] Add transaction simulation helpers
- [ ] Test event parsing with live blockchain data

### Phase 3: E2E Integration (Week 3-4)
- [ ] Build TestEnvironmentManager for isolated test environments
- [ ] Implement GitHub API mocking/testing utilities
- [ ] Create complete DAO vote → PR merge test scenario
- [ ] Add authorization and error handling tests

### Phase 4: Advanced Scenarios (Week 4-5)
- [ ] Implement fork testing against mainnet/testnet state
- [ ] Add performance and load testing scenarios
- [ ] Create test data factories and fixtures
- [ ] Add cross-provider webhook testing

### Phase 5: CI/CD Integration (Week 5-6)
- [ ] Configure GitHub Actions to run Anvil tests
- [ ] Add parallel test execution 
- [ ] Implement test result reporting
- [ ] Create performance regression detection

## Configuration Changes

### Package.json Updates
```json
{
  "devDependencies": {
    "@viem/anvil": "^0.0.7",
    "foundry-rs/forge-std": "latest",
    "@types/node": "^20.0.0"
  },
  "scripts": {
    "test:blockchain": "jest --config jest.blockchain.config.js", 
    "test:e2e-enhanced": "jest --config jest.e2e.config.js",
    "test:anvil": "npm run test:blockchain && npm run test:e2e-enhanced"
  }
}
```

### Environment Variables
```bash
# Testing Configuration
ANVIL_PORT_RANGE_START=8545
ANVIL_PORT_RANGE_END=8600
TEST_CONTRACTS_DIR=./test/contracts
TEST_GITHUB_TOKEN=<test_pat>
TEST_PARALLEL_ANVIL_INSTANCES=4

# Fork Testing (Optional)
ANVIL_FORK_URL=https://eth-sepolia.g.alchemy.com/v2/<key>
ANVIL_FORK_BLOCK_NUMBER=latest
```

### Jest Configuration
```javascript
// jest.blockchain.config.js
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test/blockchain'],
  globalSetup: '<rootDir>/test/setup/anvil-global-setup.js',
  globalTeardown: '<rootDir>/test/setup/anvil-global-teardown.js',
  testTimeout: 60000,
  maxWorkers: 2 // Limit parallel Anvil instances
};
```

## Expected Benefits

### 1. True E2E Testing
- Complete workflow validation from blockchain transaction to GitHub operation  
- Real contract interaction testing vs. fixture replay only
- Multi-step transaction simulation (vote → webhook → action → verification)

### 2. Enhanced Test Coverage
- Authorization logic testing with actual DAO/executor validation
- Error scenario testing (transaction failures, API timeouts, etc.)
- Performance testing under realistic blockchain conditions
- Cross-provider compatibility testing

### 3. Development Velocity  
- Faster feedback loops with local blockchain simulation
- No dependency on external testnets or webhook capture
- Deterministic test environments with instant reset capability
- Parallel test execution without resource conflicts

### 4. Production Confidence
- Test scenarios that closely match production usage patterns
- Validation of contract upgrade compatibility 
- Performance regression detection
- Security vulnerability testing (reentrancy, signature replay, etc.)

## Risks and Mitigation

### Risk: Increased Test Complexity
**Mitigation**: Start with simple scenarios, build utility libraries, provide clear examples

### Risk: Longer Test Execution Time  
**Mitigation**: Parallel test execution, selective test running, CI optimization

### Risk: Additional Dependencies
**Mitigation**: Docker containerization, version pinning, fallback to fixture-based tests

### Risk: Test Environment Differences
**Mitigation**: Fork testing against live networks, contract verification testing

## Success Metrics

- **Coverage**: >95% code coverage including error paths
- **Reliability**: <1% flaky test rate
- **Performance**: Complete test suite runs in <10 minutes
- **Maintainability**: New test scenarios can be added in <1 day
- **Production Readiness**: Zero production incidents related to untested scenarios

---

This design provides a comprehensive framework for testing the complete cogni-git-admin workflow while maintaining development velocity and ensuring production reliability.