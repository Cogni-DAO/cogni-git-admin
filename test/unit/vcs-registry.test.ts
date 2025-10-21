/**
 * VCS Provider Registry Tests
 */

// Mock the GitHub provider to avoid Octokit ES module issues
jest.mock('../../src/providers/vcs/github', () => ({
  gitHubVcsProvider: {
    name: 'github',
    host: 'github.com'
  }
}))

import { vcsProviderRegistry } from '../../src/providers/vcs/registry'

describe('VcsProviderRegistry', () => {
  describe('get', () => {
    test('returns GitHub provider for github.com', () => {
      const provider = vcsProviderRegistry.get('github.com')
      expect(provider).toBeDefined()
      expect(provider?.name).toBe('github')
      expect(provider?.host).toBe('github.com')
    })

    test('is case insensitive', () => {
      const provider = vcsProviderRegistry.get('GITHUB.COM')
      expect(provider).toBeDefined()
      expect(provider?.name).toBe('github')
    })

    test('returns undefined for unsupported hosts', () => {
      const provider = vcsProviderRegistry.get('bitbucket.org')
      expect(provider).toBeUndefined()
    })
  })

  describe('getSupportedHosts', () => {
    test('includes github.com', () => {
      const hosts = vcsProviderRegistry.getSupportedHosts()
      expect(hosts).toContain('github.com')
    })
  })

  describe('isSupported', () => {
    test('returns true for github.com', () => {
      expect(vcsProviderRegistry.isSupported('github.com')).toBe(true)
    })

    test('returns false for unsupported hosts', () => {
      expect(vcsProviderRegistry.isSupported('bitbucket.org')).toBe(false)
    })
  })
})