import { alchemyAdapter } from './alchemy';

export function getAdapter(provider: "alchemy") {
  if (provider === "alchemy") {
    return alchemyAdapter;
  }
  // This should never happen with current type definition, but provides runtime safety
  throw new Error(`Unknown provider: ${String(provider)}`);
}