import { timer, type TimerState } from './timer';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const storage = new Map<string, string>();
const localStorageMock = {
  getItem(key: string) {
    return storage.get(key) ?? null;
  },
  setItem(key: string, value: string) {
    storage.set(key, value);
  },
  removeItem(key: string) {
    storage.delete(key);
  },
  clear() {
    storage.clear();
  }
};

function ensureLocalStorage() {
  if (typeof localStorage === 'undefined') {
    Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });
  } else {
    localStorage.clear();
  }
}

describe('timer logic', () => {
  beforeEach(() => {
    ensureLocalStorage();
    timer.setMode('work', 10);
    timer.reset();
  });

  it('should initialize with correct state', () => {
    let state: TimerState;
    const unsub = timer.subscribe(s => (state = s));
    unsub!;
    expect(state!.mode).toBe('work');
    expect(state!.duration).toBe(10);
    expect(state!.remaining).toBe(10);
    expect(state!.running).toBe(false);
  });

  it('should start and count down', (done: () => void) => {
    timer.start();
    setTimeout(() => {
      let state: TimerState;
      const unsub = timer.subscribe(s => (state = s));
      unsub!;
      expect(state!.running).toBe(true);
      expect(state!.remaining).toBeLessThan(10);
      timer.reset();
      done();
    }, 1200);
  });

  it('should pause and reset', () => {
    timer.start();
    timer.pause();
    let state: TimerState;
    const unsub = timer.subscribe(s => (state = s));
    unsub!;
    expect(state!.running).toBe(false);
    timer.reset();
    expect(state!.remaining).toBe(10);
  });

  it('restores running timer using start time', () => {
    vi.useFakeTimers();
    const now = new Date('2026-01-01T00:00:00Z');
    vi.setSystemTime(now);
    localStorage.setItem(
      'pomodoro-timer-state',
      JSON.stringify({
        mode: 'work',
        duration: 10,
        remaining: 10,
        running: true,
        startTime: now.getTime() - 5000,
        workDuration: 10
      })
    );
    timer.restore();
    let state: TimerState;
    const unsub = timer.subscribe(s => (state = s));
    unsub!;
    expect(state!.remaining).toBe(5);
    expect(state!.running).toBe(true);
    timer.reset();
    vi.useRealTimers();
  });
});
