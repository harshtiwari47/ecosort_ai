import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:ecosort-test') });
Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
Object.defineProperty(HTMLImageElement.prototype, 'decode', { configurable: true, value: vi.fn().mockResolvedValue(undefined) });

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.clearAllMocks();
});
