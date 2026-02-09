// Timer logic for Pomodoro
import { writable, type Writable } from 'svelte/store';

export type TimerMode = 'work' | 'break';

export const DEFAULT_WORK_DURATION = 1500;
export const DEFAULT_BREAK_DURATION = 300;

export interface TimerState {
  mode: TimerMode;
  duration: number; // seconds
  remaining: number; // seconds
  running: boolean;
  startTime: number | null; // ms since epoch when current phase started
  workDuration: number; // seconds
}

function createTimer() {
  const STORAGE_KEY = 'pomodoro-timer-state';
  function loadState(): TimerState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TimerState>;
        const mode: TimerMode = parsed.mode === 'break' ? 'break' : 'work';
        const workDuration =
          typeof parsed.workDuration === 'number'
            ? parsed.workDuration
            : mode === 'break'
              ? DEFAULT_WORK_DURATION
              : typeof parsed.duration === 'number'
                ? parsed.duration
                : DEFAULT_WORK_DURATION;
        const duration =
          typeof parsed.duration === 'number'
            ? parsed.duration
            : mode === 'break'
              ? DEFAULT_BREAK_DURATION
              : workDuration;
        const remaining =
          typeof parsed.remaining === 'number'
            ? parsed.remaining
            : duration;
        const running = typeof parsed.running === 'boolean' ? parsed.running : false;
        const parsedStartTime = typeof parsed.startTime === 'number' ? parsed.startTime : null;
        let startTime = running ? parsedStartTime : null;
        if (running && startTime == null) {
          startTime = Date.now() - Math.max(0, duration - remaining) * 1000;
        }
        let state: TimerState = {
          mode,
          duration,
          remaining,
          running,
          startTime,
          workDuration
        };
        if (state.running && state.startTime != null) {
          state = deriveRunningState(state, Date.now());
        }
        return state;
      }
    } catch {}
    return {
      mode: 'work',
      duration: DEFAULT_WORK_DURATION,
      remaining: DEFAULT_WORK_DURATION,
      running: false,
      startTime: null,
      workDuration: DEFAULT_WORK_DURATION
    };
  }
  function saveState(state: TimerState) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }
  const { subscribe, set, update }: Writable<TimerState> = writable(loadState());
  let interval: ReturnType<typeof setInterval> | null = null;

  subscribe(saveState);

  function ensureInterval() {
    if (interval != null) return;
    interval = setInterval(() => {
      update(s => {
        const next = tick(s);
        saveState(next);
        if (!next.running && interval) {
          clearInterval(interval);
          interval = null;
        }
        return next;
      });
    }, 1000);
  }

  function deriveRunningState(state: TimerState, now: number): TimerState {
    const elapsedSeconds = Math.floor((now - state.startTime!) / 1000);
    if (elapsedSeconds <= 0) return state;
    const workDuration = state.workDuration;
    const breakDuration = DEFAULT_BREAK_DURATION;
    const totalDuration = workDuration + breakDuration;
    const offset = state.mode === 'break' ? workDuration : 0;
    const cycleElapsed = (elapsedSeconds + offset) % totalDuration;
    if (cycleElapsed < workDuration) {
      return {
        ...state,
        mode: 'work',
        duration: workDuration,
        remaining: workDuration - cycleElapsed,
        running: true,
        startTime: now - cycleElapsed * 1000
      };
    }
    const breakElapsed = cycleElapsed - workDuration;
    return {
      ...state,
      mode: 'break',
      duration: breakDuration,
      remaining: breakDuration - breakElapsed,
      running: true,
      startTime: now - breakElapsed * 1000
    };
  }

  function transitionPhase(state: TimerState): TimerState {
    if (state.mode === 'break') {
      return {
        ...state,
        mode: 'work',
        duration: state.workDuration,
        remaining: state.workDuration,
        running: true,
        startTime: Date.now()
      };
    }
    return {
      ...state,
      mode: 'break',
      duration: DEFAULT_BREAK_DURATION,
      remaining: DEFAULT_BREAK_DURATION,
      running: true,
      startTime: Date.now()
    };
  }

  function tick(state: TimerState): TimerState {
    if (!state.running) return state;
    const now = Date.now();
    const startTime =
      state.startTime ?? now - Math.max(0, state.duration - state.remaining) * 1000;
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    const remaining = Math.max(0, state.duration - elapsedSeconds);
    if (remaining > 1) {
      return { ...state, remaining, startTime };
    }
    return transitionPhase({ ...state, remaining, startTime });
  }

  function start() {
    update(state => {
      if (state.remaining > 0) {
        ensureInterval();
      }
      const now = Date.now();
      const startTime =
        state.startTime ?? now - Math.max(0, state.duration - state.remaining) * 1000;
      const next = { ...state, running: true, startTime };
      saveState(next);
      return next;
    });
  }

  function pause() {
    update(state => {
      if (state.running && interval) {
        clearInterval(interval);
        interval = null;
      }
      const now = Date.now();
      const remaining =
        state.startTime == null
          ? state.remaining
          : Math.max(0, state.duration - Math.floor((now - state.startTime) / 1000));
      const next = { ...state, running: false, remaining, startTime: null };
      saveState(next);
      return next;
    });
  }

  function stop() {
    pause();
    update(state => {
      const next: TimerState = {
        ...state,
        mode: 'work',
        duration: state.workDuration,
        remaining: state.workDuration,
        running: false,
        startTime: null
      };
      saveState(next);
      return next;
    });
  }

  function setMode(mode: TimerMode, duration: number) {
    pause();
    update(state => {
      const next = {
        ...state,
        mode,
        duration,
        remaining: duration,
        running: false,
        startTime: null,
        workDuration: mode === 'break' ? state.workDuration : duration
      };
      saveState(next);
      return next;
    });
  }

  function setProgress(progress: number) {
    update(state => {
      const clamped = Math.max(0, Math.min(1, progress));
      const totalDuration = state.workDuration + DEFAULT_BREAK_DURATION;
      const elapsed = clamped * totalDuration;
      let mode: TimerMode;
      let duration: number;
      let remaining: number;
      if (elapsed <= state.workDuration) {
        mode = 'work';
        duration = state.workDuration;
        remaining = Math.round(duration - elapsed);
      } else {
        mode = 'break';
        duration = DEFAULT_BREAK_DURATION;
        remaining = Math.round(duration - (elapsed - state.workDuration));
      }
      remaining = Math.max(0, Math.min(duration, remaining));
      const startTime =
        state.running
          ? Date.now() - Math.max(0, duration - remaining) * 1000
          : null;
      const next = { ...state, mode, duration, remaining, startTime };
      if (next.running && interval == null && next.remaining > 0) {
        ensureInterval();
      }
      saveState(next);
      return next;
    });
  }

    return {
      subscribe,
      start,
      pause,
      stop,
      setMode,
      setProgress,
      restore() {
      const state = loadState();
      set(state);
      if (state.running && state.remaining > 0) {
        saveState(state);
        start();
      }
    }
  };
}

export const timer = createTimer();
