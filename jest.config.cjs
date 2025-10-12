module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src','<rootDir>/test'],
  transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }] },
  transformIgnorePatterns: [
    'node_modules/(?!(@octokit|octokit|bottleneck)/)'
  ]
};