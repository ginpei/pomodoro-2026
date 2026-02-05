import { timer, type TimerState } from './timer';
import { describe, it, expect, beforeEach } from 'vitest';

describe('timer logic', () => {
  beforeEach(() => {
    timer.setMode('work', 10);
    timer.stop();
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
      timer.stop();
      done();
    }, 1200);
  });

  it('should pause and stop', () => {
    timer.start();
    timer.pause();
    let state: TimerState;
    const unsub = timer.subscribe(s => (state = s));
    unsub!;
    expect(state!.running).toBe(false);
    timer.stop();
    expect(state!.remaining).toBe(10);
  });
});
