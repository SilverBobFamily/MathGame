import { renderHook, act } from '@testing-library/react';
import { useSoundEnabled } from '../useSoundEnabled';

describe('useSoundEnabled', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to true (sound on) when no stored value', () => {
    const { result } = renderHook(() => useSoundEnabled());
    expect(result.current.enabled).toBe(true);
  });

  it('reads stored "on" value as true', () => {
    localStorage.setItem('mathemagic-sounds', 'on');
    const { result } = renderHook(() => useSoundEnabled());
    expect(result.current.enabled).toBe(true);
  });

  it('reads stored "off" value as false', () => {
    localStorage.setItem('mathemagic-sounds', 'off');
    const { result } = renderHook(() => useSoundEnabled());
    expect(result.current.enabled).toBe(false);
  });

  it('toggle() flips true to false and persists', () => {
    const { result } = renderHook(() => useSoundEnabled());
    act(() => { result.current.toggle(); });
    expect(result.current.enabled).toBe(false);
    expect(localStorage.getItem('mathemagic-sounds')).toBe('off');
  });

  it('toggle() flips false to true and persists', () => {
    localStorage.setItem('mathemagic-sounds', 'off');
    const { result } = renderHook(() => useSoundEnabled());
    act(() => { result.current.toggle(); });
    expect(result.current.enabled).toBe(true);
    expect(localStorage.getItem('mathemagic-sounds')).toBe('on');
  });
});
