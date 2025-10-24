import { Address,decodeEventLog, Hex, parseAbi } from 'viem';

export const abi = parseAbi([
  'event CogniAction(address indexed dao,uint256 indexed chainId,string repoUrl,string action,string target,string resource,bytes extra,address indexed executor)'
]);

export const COGNI_TOPIC0 = '0x4f096f86866ffcbacfb2579a69658044a6c255f9249da70c34ef3e57c3226083';

export function tryParseCogniLog(log: { address: Address; topics: Hex[]; data: Hex }) {
  if (!log?.topics?.[0] || log.topics[0].toLowerCase() !== COGNI_TOPIC0) return null;
  
  const { args } = decodeEventLog({ abi, data: log.data, topics: log.topics as [Hex, ...Hex[]] });
  
  return {
    dao: args.dao,
    chainId: BigInt(args.chainId as unknown as string),
    repoUrl: args.repoUrl,
    action: args.action,
    target: args.target,
    resource: args.resource,
    extra: args.extra,
    executor: args.executor
  };
}