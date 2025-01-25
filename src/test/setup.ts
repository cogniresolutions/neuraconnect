import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  interface Assertion<T = any>
    extends jest.Matchers<void, T>,
      TestingLibraryMatchers<T, void> {}
  interface AsymmetricMatchersContaining
    extends jest.Matchers<void, any>,
      TestingLibraryMatchers<any, void> {}
}

expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});