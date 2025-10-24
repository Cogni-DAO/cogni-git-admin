/**
 * Repository Reference Parser Tests
 */

import { parseRepoUrl,RepoRef } from '../../src/providers/vcs/repo-ref'

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
        url: 'https://github.com/owner/repo.git'
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
      expect(() => parseRepoUrl('not-a-url')).toThrow('Invalid repository URL format')
    })

    test('throws error for empty string', () => {
      expect(() => parseRepoUrl('')).toThrow('Repository URL must be a non-empty string')
    })

    test('throws error for URL without path', () => {
      expect(() => parseRepoUrl('https://github.com')).toThrow('Invalid repository path in URL')
    })

    test('throws error for URL with insufficient path parts', () => {
      expect(() => parseRepoUrl('https://github.com/owner')).toThrow('Repository URL must contain owner and repo')
    })

    test('throws error for URL with empty owner or repo', () => {
      expect(() => parseRepoUrl('https://github.com//repo')).toThrow('Owner and repository name cannot be empty')
      expect(() => parseRepoUrl('https://github.com/owner/')).toThrow('Owner and repository name cannot be empty')
    })
  })

  describe('RepoRef.parse', () => {
    test('static parse method works identically', () => {
      const url = 'https://github.com/owner/repo'
      const directResult = parseRepoUrl(url)
      const staticResult = RepoRef.parse(url)
      
      expect(staticResult).toEqual(directResult)
    })
  })

  describe('RepoRef.format', () => {
    test('formats RepoRef as owner/repo string', () => {
      const repoRef = {
        host: 'github.com',
        owner: 'owner',
        repo: 'repo',
        url: 'https://github.com/owner/repo'
      }
      
      expect(RepoRef.format(repoRef)).toBe('owner/repo')
    })
  })

  describe('RepoRef.isSupportedHost', () => {
    test('returns true for supported hosts', () => {
      expect(RepoRef.isSupportedHost('github.com')).toBe(true)
      expect(RepoRef.isSupportedHost('GITHUB.COM')).toBe(true)
      expect(RepoRef.isSupportedHost('gitlab.com')).toBe(true)
    })

    test('returns false for unsupported hosts', () => {
      expect(RepoRef.isSupportedHost('bitbucket.org')).toBe(false)
      expect(RepoRef.isSupportedHost('example.com')).toBe(false)
    })
  })
})