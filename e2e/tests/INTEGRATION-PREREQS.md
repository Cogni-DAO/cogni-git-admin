# Blockchain Integration Test Prerequisites

## 🔧 Required Environment Variables

### Blockchain Configuration

| Variable | Current Value | Purpose |
|----------|---------------|---------|
| `EVM_RPC_URL` | `https://eth-sepolia.g.alchemy.com/v2/d-5ZoOLWfQQSzyHMauO3D` | Sepolia testnet RPC endpoint for blockchain interactions |
| `E2E_TEST_WALLET_PRIVATE_KEY` | `0x14788f1aa7e87f69ebb28d8a3369f1f55ffcfc3db349602f4041baaa0dde0ac1` | Test wallet private key (must have Sepolia ETH for gas) |
| `E2E_COGNISIGNAL_CONTRACT` | `0x8f26cf7b9ca6790385e255e8ab63acc35e7b9fb1` | CogniSignal contract address on Sepolia |
| `E2E_ADMIN_PLUGIN_CONTRACT` | `0x77BA7C0663b2f48F295E12e6a149F4882404B4ea` | Aragon Admin Plugin contract address |
| `E2E_DAO_ADDRESS` | `0xB0FcB5Ae33DFB4829f663458798E5e3843B21839` | DAO address that owns the Admin Plugin |

### GitHub Configuration  

| Variable | Current Value | Purpose |
|----------|---------------|---------|
| `E2E_TEST_REPO` | `derekg1729/test-repo` | GitHub repository for creating test PRs |
| `E2E_TEST_REPO_GITHUB_PAT` | `github_pat_11AN7MYZI0a1xYHn4V0rVC_...` | GitHub Personal Access Token with repo permissions |

### Application Configuration

| Variable | Current Value | Purpose |
|----------|---------------|---------|
| `E2E_APP_DEPLOYMENT_URL` | `http://localhost:3000` | cogni-git-admin app URL to receive webhooks |

### Optional Timing Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `E2E_WEBHOOK_TIMEOUT_MS` | `120000` (2 min) | Max time to wait for webhook processing |
| `E2E_POLL_INTERVAL_MS` | `5000` (5 sec) | GitHub PR status check interval |

## 🌐 External Service Dependencies

### 1. Alchemy Webhook Configuration 

- **Service**: Alchemy Sepolia webhook notifications
- **Contract Monitored**: `0x8f26cf7b9ca6790385e255e8ab63acc35e7b9fb1` (CogniSignal)
- **Expected Webhook Target**: `{E2E_APP_DEPLOYMENT_URL}/api/v1/webhooks/onchain/cogni-signal`
- **Trigger**: `CogniAction` event emissions from the contract
- **Requirement**: Alchemy must be configured to monitor this specific contract and send webhooks to the app

### 2. Sepolia Testnet Requirements

- **Network**: Ethereum Sepolia Testnet (Chain ID: 11155111)
- **Gas Requirements**: Test wallet must have sufficient Sepolia ETH
- **Current Balance Check**: Test queries wallet balance before execution
- **Block Confirmation**: Waits for transaction receipt confirmation

### 3. GitHub Repository Setup

- **Repository**: Must exist and be accessible with the provided PAT
- **Permissions**: PAT needs `repo` scope for creating PRs, branches, and commits  
- **Base Branch**: Repository must have a `main` branch
- **Bot Integration**: cogni-git-admin GitHub App must be installed on the repository

### 4. Smart Contract Deployment State

- **CogniSignal Contract**: Must be deployed and functional at specified address
- **Admin Plugin**: Must be properly configured with DAO permissions
- **DAO Configuration**: DAO must have execution permissions on the Admin Plugin
- **Function Signatures**: Contracts must match the expected ABI definitions

## 🔄 Test Workflow Dependencies

### Phase 1: PR Creation

- GitHub CLI (`gh`) must be available in test environment
- Test repo must accept new branches and PRs
- Git user configuration for commits

### Phase 2: DAO Vote Execution  

- Wallet must have gas for Sepolia transactions
- Admin Plugin must allow immediate proposal execution (startDate=0, endDate=0)
- CogniSignal contract must emit events correctly

### Phase 3: Webhook Processing

- Alchemy webhook delivery must be reliable and timely
- cogni-git-admin app must be running and accessible
- Webhook processing must complete within timeout window

### Phase 4: PR Merge Verification

- GitHub API must be accessible for PR status checks
- cogni-git-admin must have merge permissions on the repository
- Merge should happen within the 2-minute timeout window

## ⚠️ Critical Expectations

### 1. Alchemy Webhook Delivery
- Must monitor contract `0x8f26cf7b9ca6790385e255e8ab63acc35e7b9fb1` 
- Must send webhooks to `http://localhost:3000/api/v1/webhooks/onchain/cogni-signal`
- Must deliver within ~30-60 seconds of transaction confirmation

### 2. DAO Permission Alignment
- `E2E_DAO_ADDRESS` (0xB0FcB5...) must match `ALLOWED_DAO` in app config
- Both must have execution rights on Admin Plugin
- CogniSignal must accept calls from Admin Plugin

### 3. GitHub App Configuration
- cogni-git-admin GitHub App must be installed on `derekg1729/test-repo`
- App must have merge permissions and webhook processing enabled
- Repository must match `E2E_TEST_REPO` and `ALLOWED_REPO` settings

### 4. Network Connectivity
- Test environment must reach Sepolia RPC endpoint
- Test environment must reach GitHub API  
- Alchemy must reach the deployed app URL for webhook delivery

---

This comprehensive setup enables the full end-to-end test: **DAO vote → blockchain event → webhook → PR merge!** 🎯