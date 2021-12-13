import type {Config} from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['./lingua-franca']
};
export default config;