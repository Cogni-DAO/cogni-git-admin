module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src','<rootDir>/test','<rootDir>/e2e'],
  transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }] }
};