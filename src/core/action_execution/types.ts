import { Signal } from '../signal/signal';
import { ExecContext } from './context';

export interface ActionResult {
  success: boolean;
  action: string;
  error?: string;
  // Domain-specific additional properties that actions can include
  username?: string;
  repo?: string;
  permission?: string;
  prNumber?: number;
  collaboratorRemoved?: boolean;
  invitationCancelled?: boolean;
  // Special case for availableActions array
  availableActions?: string[];
  // Allow other string/number/boolean values for extensibility
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface ActionHandler {
  // Action metadata
  readonly action: string;        // "merge"
  readonly target: string;        // "change" 
  readonly description: string;   // Human readable description
  
  // Signal-based execution
  run(signal: Signal, ctx: ExecContext): Promise<ActionResult>;
}