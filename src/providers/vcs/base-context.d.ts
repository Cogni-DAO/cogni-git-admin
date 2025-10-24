/**
 * TypeScript definitions for Context interface used by Cogni gates
 * This matches the Probot Context interface structure that gates expect
 */

export interface BaseContext {
  // Core webhook payload (GitHub-like structure)
  payload: {
    repository: {
      name: string;
      full_name: string;
    };
    installation: {
      id: string | number;
    };
    pull_request?: {
      id: number;
      number: number;
      state: string;
      title: string;
      head: {
        sha: string;
        repo: {
          name: string;
          full_name: string;
        };
      };
      base: {
        sha: string;
        repo: {
          name: string; 
          full_name: string;
        };
      };
      changed_files?: number;
      additions?: number;
      deletions?: number;
    };
    action?: string;
    [key: string]: any;
  };

  // Repository metadata function
  repo(options?: Record<string, any>): {
    owner: string;
    repo: string;
    [key: string]: any;
  };

  // Minimal admin-only VCS interface for cogni-git-admin
  vcs: {
    pulls: {
      /**
       * Merge a pull request/merge request
       */
      merge(params: {
        owner: string;
        repo: string;
        pull_number: number;
        merge_method?: 'merge' | 'squash' | 'rebase';
        commit_title?: string;
        commit_message?: string;
      }): Promise<{
        sha?: string;
        merged: boolean;
        message?: string;
      }>
    };
    collaborators: {
      /**
       * Add user as repository collaborator
       */
      add(params: {
        owner: string;
        repo: string;
        username: string;
        permission?: 'admin' | 'maintain' | 'push' | 'triage' | 'pull';
      }): Promise<{
        status: number;
      }>
      
      /**
       * Remove user as repository collaborator
       */
      remove(params: {
        owner: string;
        repo: string;
        username: string;
      }): Promise<{
        status: number;
      }>
    };
  };

  spec?: {
    gates?: Array<{
      type: string;
      id?: string;
      with?: Record<string, any>;
    }>;
    [key: string]: any;
  };

  annotation_budget?: number;
  idempotency_key?: string;
  reviewLimitsConfig?: Record<string, any>;

  // Logging interface (minimal Pino-like interface)
  log?: {
    info(msg: string | object, ...args: any[]): void;
    error(msg: string | object, ...args: any[]): void;
    warn(msg: string | object, ...args: any[]): void;
    debug(msg: string | object, ...args: any[]): void;
    child(bindings: Record<string, any>): any;
  };
}

/**
 * Abstract base class for host adapters
 * Implements the BaseContext interface
 */
export abstract class HostAdapter implements BaseContext {
  abstract payload: BaseContext['payload'];
  abstract repo(options?: Record<string, any>): ReturnType<BaseContext['repo']>;
  abstract vcs: BaseContext['vcs'];

  // Optional properties that may be set by orchestrator
  pr?: BaseContext['pr'];
  spec?: BaseContext['spec'];
  annotation_budget?: number;
  idempotency_key?: string;
  reviewLimitsConfig?: Record<string, any>;
  log?: BaseContext['log'];
}

// Type helper for JSDoc annotations
export type ContextLike = BaseContext;