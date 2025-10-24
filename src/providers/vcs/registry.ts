/**
 * VCS Provider Registry
 * 
 * Central registry for VCS providers keyed by host
 */

import { gitHubVcsProvider } from './github'
import { VcsProvider, VcsProviderRegistry } from './types'

/**
 * VCS Provider Registry Implementation
 */
class VcsProviderRegistryImpl implements VcsProviderRegistry {
  private providers = new Map<string, VcsProvider>()

  /**
   * Get VCS provider for host
   */
  get(host: string): VcsProvider | undefined {
    return this.providers.get(host.toLowerCase())
  }

  /**
   * Register VCS provider for host
   */
  register(host: string, provider: VcsProvider): void {
    this.providers.set(host.toLowerCase(), provider)
  }

  /**
   * List all supported hosts
   */
  getSupportedHosts(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Check if host is supported
   */
  isSupported(host: string): boolean {
    return this.providers.has(host.toLowerCase())
  }
}

/**
 * Global VCS provider registry instance
 */
export const vcsProviderRegistry = new VcsProviderRegistryImpl()

// Register default providers
vcsProviderRegistry.register('github.com', gitHubVcsProvider)