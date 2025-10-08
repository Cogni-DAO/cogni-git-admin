import { parseAbi, decodeEventLog, Hex, Address } from 'viem';

export const abi = parseAbi([
  'event CogniAction(address indexed dao,uint256 indexed chainId,string repo,string action,string target,uint256 pr,bytes32 commit,bytes extra,address indexed executor)'
]);

export const COGNI_TOPIC0 = '0xfd9a8ea95d56c7bd709823c6589c50386a2e5833892ef0e93c7bf63fee30bde1';

export function tryParseCogniLog(log: { address: Address; topics: Hex[]; data: Hex }) {
  if (!log?.topics?.[0] || log.topics[0].toLowerCase() !== COGNI_TOPIC0) return null;
  
  const { args } = decodeEventLog({ abi, data: log.data, topics: log.topics as [Hex, ...Hex[]] });
  
  return {
    dao: args.dao as Address,
    chainId: BigInt(args.chainId as unknown as string),
    repo: args.repo as string,
    action: args.action as string,
    target: args.target as string,
    pr: Number(args.pr),
    commit: args.commit as Hex,
    extra: args.extra as Hex,
    executor: args.executor as Address
  };
}