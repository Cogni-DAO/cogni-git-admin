import { Address, decodeEventLog, Hex, parseAbi, decodeAbiParameters } from 'viem';

import { Action, Signal, Target } from './signal';

function isValidAction(value: string): value is Action {
  return ['merge', 'grant', 'revoke'].includes(value);
}

function isValidTarget(value: string): value is Target {
  return ['change', 'collaborator'].includes(value);
}

export const abi = parseAbi([
  'event CogniAction(address indexed dao,uint256 indexed chainId,string repoUrl,string action,string target,string resource,bytes extra,address indexed executor)'
]);

export const COGNI_TOPIC0 = '0x4f096f86866ffcbacfb2579a69658044a6c255f9249da70c34ef3e57c3226083';

/**
 * Parse CogniAction event log into Signal
 * This is the only function that knows about the raw blockchain event structure
 */
export function parseCogniAction(log: { address: Address; topics: Hex[]; data: Hex }): Signal | null {
  if (!log?.topics?.[0] || log.topics[0].toLowerCase() !== COGNI_TOPIC0) return null;
  
  try {
    const { args } = decodeEventLog({ abi, data: log.data, topics: log.topics as [Hex, ...Hex[]] });
    
    // Parse extra field which contains abi.encode(nonce, deadline, paramsJson)
    let nonce = BigInt(0);
    let deadline = 0;
    let paramsJson = '';
    
    if (args.extra && args.extra !== '0x' && args.extra.length > 2) {
      try {
        const decoded = decodeAbiParameters(
          [
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint64' },
            { name: 'paramsJson', type: 'string' }
          ],
          args.extra as Hex
        );
        nonce = decoded[0];
        deadline = Number(decoded[1]);
        paramsJson = decoded[2];
      } catch (error) {
        console.warn('Failed to decode extra field, using defaults:', error);
        // Fall back to defaults - this handles legacy events with empty extra
      }
    } else {
      // Handle empty extra field: set a generous deadline for MVP
      deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
      console.warn('Empty extra field detected, setting deadline to 24 hours from now');
    }
    
    const action = args.action;
    const target = args.target;
    
    // Validate enum values
    if (!isValidAction(action)) {
      throw new Error(`Invalid action: ${action}. Expected: merge, grant, revoke`);
    }
    if (!isValidTarget(target)) {
      throw new Error(`Invalid target: ${target}. Expected: change, collaborator`);
    }
    
    return {
      dao: args.dao,
      chainId: BigInt(args.chainId as unknown as string),
      vcs: 'github', // V1: hardcode to github, add vcs field later
      repoUrl: args.repoUrl,
      action,
      target,
      resource: args.resource,
      nonce,
      deadline,
      paramsJson,
      executor: args.executor
    };
  } catch (error) {
    console.error('Failed to parse CogniAction log:', error);
    return null;
  }
}

// Legacy function for backward compatibility - remove after refactor complete
export function tryParseCogniLog(log: { address: Address; topics: Hex[]; data: Hex }) {
  return parseCogniAction(log);
}