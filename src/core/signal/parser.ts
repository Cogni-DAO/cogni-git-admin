import { Address,decodeEventLog, Hex, parseAbi } from 'viem';

export const abi = parseAbi([
  'event CogniAction(address indexed dao,uint256 indexed chainId,string repo,string action,string target,uint256 pr,bytes32 commit,bytes extra,address indexed executor)'
]);

export const COGNI_TOPIC0 = '0xfd9a8ea95d56c7bd709823c6589c50386a2e5833892ef0e93c7bf63fee30bde1';

export function tryParseCogniLog(log: { address: Address; topics: Hex[]; data: Hex }) {
  if (!log?.topics?.[0] || log.topics[0].toLowerCase() !== COGNI_TOPIC0) return null;
  
  const { args } = decodeEventLog({ abi, data: log.data, topics: log.topics as [Hex, ...Hex[]] });
  
  return {
    dao: args.dao,
    chainId: BigInt(args.chainId as unknown as string),
    repo: args.repo,
    action: args.action,
    target: args.target,
    pr: Number(args.pr),
    commit: args.commit,
    extra: args.extra,
    executor: args.executor
  };
}