import { alchemyAdapter } from './alchemy';

export function getAdapter(provider: "alchemy") {
  if (provider === "alchemy") {
    return alchemyAdapter;
  }
  throw new Error(`Unknown provider: ${provider}`);
}