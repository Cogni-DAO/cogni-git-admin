# CogniSignal Schema Analysis & Redesign

## Current Schema Issues

### 1. Tight Coupling to Pull Request Model
The current schema has hardcoded fields that are PR-centric:
- `uint256 pr` - Only relevant for PR operations
- `bytes32 commit` - Only relevant for commit-related operations
- Forces non-PR actions to use dummy values (pr=0, commit=bytes32(0))

### 2. Poor Parameter Encoding
For ADD_ADMIN/REMOVE_ADMIN actions:
- Username must be hex-encoded into `bytes extra` field
- Requires manual hex encoding/decoding on both ends
- No type safety or validation at contract level
- Error-prone manual string manipulation

### 3. Inflexible Field Usage
Current usage patterns show the problem:

**PR_APPROVE:pull_request:**
- Uses: `repo`, `action`, `target`, `pr`
- Ignores: `commit`, `extra` (set to empty)

**ADD_ADMIN:repository:**
- Uses: `repo`, `action`, `target`, `extra` (hex-encoded username)
- Ignores: `pr` (set to 0), `commit` (set to bytes32(0))

**REMOVE_ADMIN:repository:**
- Same problematic pattern as ADD_ADMIN

### 4. No Forward Compatibility
Adding new action types requires either:
- Overloading existing fields inappropriately
- Contract upgrade (breaking change)
- Complex parameter encoding in `extra` bytes

## Analysis: Most Extensible Design

### Core Requirements
1. **Action-agnostic**: No hardcoded fields for specific action types
2. **Type-safe**: Proper encoding/decoding without manual hex manipulation
3. **Extensible**: New actions without contract changes
4. **Efficient**: Gas-optimal while maintaining flexibility
5. **Developer-friendly**: Clear parameter structure

### Recommended Schema Design

#### Option 1: Pure Key-Value Approach
```solidity
event CogniAction(
    address indexed dao,
    uint256 indexed chainId,
    string repo,
    string indexed action,  // Make indexed for filtering
    string indexed target,  // Make indexed for filtering
    string[] paramKeys,     // ["pr", "username", "branch", etc.]
    string[] paramValues,   // ["123", "alice", "main", etc.]
    address indexed executor
);
```

**Pros:**
- Completely generic - any action can define any parameters
- Type information preserved in key names
- Easy to add new parameters without schema changes
- Human-readable parameter names

**Cons:**
- Higher gas cost due to string arrays
- No compile-time type safety on parameter values
- Requires parsing logic for type conversion

#### Option 2: Structured ABI-Encoded Parameters
```solidity
event CogniAction(
    address indexed dao,
    uint256 indexed chainId,
    string repo,
    string indexed action,
    string indexed target,
    bytes parameters,       // ABI-encoded struct based on action type
    address indexed executor
);
```

**Pros:**
- Gas efficient
- Type-safe encoding/decoding
- Supports complex data types (arrays, structs, etc.)
- Familiar ABI encoding patterns

**Cons:**
- Requires action-specific parameter struct definitions
- Less human-readable in raw form
- Need parameter schema registry off-chain

#### Option 3: JSON-Like String Parameters
```solidity
event CogniAction(
    address indexed dao,
    uint256 indexed chainId,
    string repo,
    string indexed action,
    string indexed target,
    string parametersJson,  // {"pr": 123, "username": "alice", "force": true}
    address indexed executor
);
```

**Pros:**
- Human-readable
- Supports complex nested data
- Easy integration with web APIs
- Self-documenting parameter names

**Cons:**
- Parsing complexity
- Higher gas costs for string data
- No compile-time validation
- Potential JSON parsing errors

### Recommended Solution: Option 2 (ABI-Encoded)

The ABI-encoded approach provides the best balance of:
- **Gas efficiency**: Compact binary encoding
- **Type safety**: Leverages Solidity's type system
- **Extensibility**: New actions define new parameter structs
- **Tooling support**: Standard ABI encoding/decoding libraries

#### Implementation Strategy

```solidity
// Parameter struct examples
struct PRApproveParams {
    uint256 prNumber;
    bool force;           // Override protection rules
    string mergeMethod;   // "merge", "squash", "rebase"
}

struct AdminParams {
    string username;
    string permission;    // "admin", "write", "read"
    uint256 expiration;   // Unix timestamp (0 = no expiration)
}

struct BranchParams {
    string branchName;
    string baseBranch;
    bool protected;
}

// Generic event
event CogniAction(
    address indexed dao,
    uint256 indexed chainId,
    string repo,
    string indexed action,
    string indexed target,
    bytes parameters,     // abi.encode(ActionParams)
    address indexed executor
);
```

#### Client-Side Parameter Registry

```typescript
// Parameter type registry for each action
const ACTION_PARAMS = {
  'PR_APPROVE:pull_request': 'tuple(uint256 prNumber,bool force,string mergeMethod)',
  'ADD_ADMIN:repository': 'tuple(string username,string permission,uint256 expiration)',
  'REMOVE_ADMIN:repository': 'tuple(string username)',
  'CREATE_BRANCH:repository': 'tuple(string branchName,string baseBranch,bool protected)',
  // New actions can be added without contract changes
} as const;
```

### Migration Strategy

#### Phase 1: Dual Schema Support
- Deploy new contract with extensible schema
- Maintain backward compatibility with current parser
- Add new parameter registry system

#### Phase 2: Action Handler Updates
- Update all action handlers to use new parameter format
- Add validation for new parameter structures
- Maintain old format support during transition

#### Phase 3: Complete Migration
- Switch all DAO integrations to new schema
- Remove legacy parameter parsing
- Clean up deprecated code

## Benefits of New Design

1. **Extensibility**: New actions without contract changes
2. **Type Safety**: Proper ABI encoding prevents encoding errors
3. **Gas Efficiency**: Binary encoding vs string manipulation
4. **Clear Semantics**: Each action defines its own parameter structure
5. **Future-Proof**: Can support complex data types as needed
6. **Developer Experience**: Standard ABI tooling support

## Action-Specific Examples

### PR_APPROVE with Rich Parameters
```typescript
const params = {
  prNumber: 123,
  force: true,           // Override failed checks
  mergeMethod: "squash"  // Squash merge
};

const encoded = encodeAbiParameters(
  [{ type: 'tuple', components: [
    { type: 'uint256', name: 'prNumber' },
    { type: 'bool', name: 'force' },
    { type: 'string', name: 'mergeMethod' }
  ]}],
  [params]
);
```

### ADD_ADMIN with Expiration
```typescript
const params = {
  username: "alice",
  permission: "admin",
  expiration: 1735689600  // Jan 1, 2025
};

const encoded = encodeAbiParameters(
  [{ type: 'tuple', components: [
    { type: 'string', name: 'username' },
    { type: 'string', name: 'permission' },
    { type: 'uint256', name: 'expiration' }
  ]}],
  [params]
);
```

### Future Action: CREATE_ISSUE
```typescript
const params = {
  title: "Bug report",
  body: "Description of the issue...",
  labels: ["bug", "priority:high"],
  assignees: ["alice", "bob"]
};

// No contract changes needed - just define new parameter structure
```

This design eliminates all current schema limitations while providing a foundation for unlimited future extensibility.