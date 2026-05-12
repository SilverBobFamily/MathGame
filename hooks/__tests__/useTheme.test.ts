import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme';

const mockMatchMedia = (prefersDark: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn((query: string) => ({
      matches: prefersDark && query === '(prefers-color-scheme: dark)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
};

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    mockMatchMedia(true);
  });

  it('defaults to dark when system prefers dark and no stored theme', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
  });

  it('defaults to light when system prefers light and no stored theme', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });

  it('uses stored theme from localStorage over system preference', () => {
    localStorage.setItem('mathemagic-theme', 'light');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });

  it('toggle() flips dark to light', () => {
    localStorage.setItem('mathemagic-theme', 'dark');
    const { result } = renderHook(() => useTheme());
    act(() => { result.current.toggle(); });
    expect(result.current.theme).toBe('light');
  });

  it('toggle() flips light to dark', () => {
    localStorage.setItem('mathemagic-theme', 'light');
    const { result } = renderHook(() => useTheme());
    act(() => { result.current.toggle(); });
    expect(result.current.theme).toBe('dark');
  });

  it('toggle() persists new theme in localStorage', () => {
    localStorage.setItem('mathemagic-theme', 'dark');
    const { result } = renderHook(() => useTheme());
    act(() => { result.current.toggle(); });
    expect(localStorage.getItem('mathemagic-theme')).toBe('light');
  });

  it('toggle() updates data-theme attribute on <html>', () => {
    localStorage.setItem('mathemagic-theme', 'dark');
    const { result } = renderHook(() => useTheme());
    act(() => { result.current.toggle(); });
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
