/**
 * Repository Reference Parser Tests
 */

import { fullName,parseRepoRef } from '../../src/core/signal/signal'
import { isSupportedHost,parseRepoUrl } from '../../src/providers/vcs/repo-ref'

describe('RepoRef', () => {
  describe('parseRepoUrl', () => {
    test('parses standard GitHub HTTPS URL', () => {
      const result = parseRepoUrl('https://github.com/owner/repo')
      
      expect(result).toEqual({
        host: 'github.com',
        owner: 'owner',
        repo: 'repo',
        url: 'https://github.com/owner/repo'
      })
    })

    test('parses GitHub URL with .git suffix', () => {
      const result = parseRepoUrl('https://github.com/owner/repo.git')
      
      expect(result).toEqual({
        host: 'github.com',
        owner: 'owner',
        repo: 'repo',
        url: 'https://github.com/owner/repo'
      })
    })

    test('parses GitLab URL', () => {
      const result = parseRepoUrl('https://gitlab.com/owner/project')
      
      expect(result).toEqual({
        host: 'gitlab.com',
        owner: 'owner',
        repo: 'project',
        url: 'https://gitlab.com/owner/project'
      })
    })

    test('throws error for invalid URL format', () => {
      expect(() => parseRepoUrl('not-a-url')).toThrow('Failed to parse repository URL')
    })

    test('throws error for empty string', () => {
      expect(() => parseRepoUrl('')).toThrow('Failed to parse repository URL')
    })

    test('throws error for URL without path', () => {
      expect(() => parseRepoUrl('https://github.com')).toThrow('Repository URL must contain owner and repo')
    })

    test('throws error for URL with insufficient path parts', () => {
      expect(() => parseRepoUrl('https://github.com/owner')).toThrow('Repository URL must contain owner and repo')
    })

    test('throws error for URL with empty owner or repo', () => {
      expect(() => parseRepoUrl('https://github.com//repo')).toThrow('Repository URL must contain owner and repo')
      expect(() => parseRepoUrl('https://github.com/owner/')).toThrow('Repository URL must contain owner and repo')
    })
  })

  describe('parseRepoRef', () => {
    test('signal domain parser works identically', () => {
      const url = 'https://github.com/owner/repo'
      const directResult = parseRepoUrl(url)
      const signalResult = parseRepoRef(url)
      
      expect(signalResult).toEqual(directResult)
    })
  })

  describe('fullName helper', () => {
    test('formats RepoRef as owner/repo string', () => {
      const repoRef = {
        host: 'github.com',
        owner: 'owner',
        repo: 'repo',
        url: 'https://github.com/owner/repo'
      }
      
      expect(fullName(repoRef)).toBe('owner/repo')
    })
  })

  describe('isSupportedHost', () => {
    test('returns true for supported hosts', () => {
      expect(isSupportedHost('github.com')).toBe(true)
      expect(isSupportedHost('GITHUB.COM')).toBe(true)
      expect(isSupportedHost('gitlab.com')).toBe(true)
    })

    test('returns false for unsupported hosts', () => {
      expect(isSupportedHost('bitbucket.org')).toBe(false)
      expect(isSupportedHost('example.com')).toBe(false)
    })
  })
})