// Timer logic for Pomodoro
import { writable, type Writable } from 'svelte/store';

export type TimerMode = 'work' | 'break' | 'custom';

export interface TimerState {
  mode: TimerMode;
  duration: number; // seconds
  remaining: number; // seconds
  running: boolean;
}

function createTimer() {
  const initial: TimerState = {
    mode: 'work',
    duration: 1500, // 25 min default
    remaining: 1500,
    running: false
  };
  const { subscribe, set, update }: Writable<TimerState> = writable(initial);
  let interval: ReturnType<typeof setInterval> | null = null;

  function start() {
    update(state => {
      if (!state.running) {
        interval = setInterval(() => {
          update(s => {
            if (s.running && s.remaining > 0) {
              return { ...s, remaining: s.remaining - 1 };
            } else {
              stop();
              return { ...s, running: false };
            }
          });
        }, 1000);
      }
      return { ...state, running: true };
    });
  }

  function pause() {
    update(state => {
      if (state.running && interval) {
        clearInterval(interval);
        interval = null;
      }
      return { ...state, running: false };
    });
  }

  function stop() {
    pause();
    update(state => ({ ...state, remaining: state.duration, running: false }));
  }

  function setMode(mode: TimerMode, duration: number) {
    pause();
    update(state => ({ ...state, mode, duration, remaining: duration, running: false }));
  }

  function setCustom(duration: number) {
    setMode('custom', duration);
  }

  return {
    subscribe,
    start,
    pause,
    stop,
    setMode,
    setCustom
  };
}

export const timer = createTimer();
