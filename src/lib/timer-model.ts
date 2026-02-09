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

export function normalizeTimerState(
  input: Partial<TimerState> | null,
  now: number
): TimerState {
  const mode: TimerMode = input?.mode === 'break' ? 'break' : 'work';
  const workDuration =
    typeof input?.workDuration === 'number'
      ? input.workDuration
      : mode === 'break'
        ? DEFAULT_WORK_DURATION
        : typeof input?.duration === 'number'
          ? input.duration
          : DEFAULT_WORK_DURATION;
  const duration =
    typeof input?.duration === 'number'
      ? input.duration
      : mode === 'break'
        ? DEFAULT_BREAK_DURATION
        : workDuration;
  const remaining = typeof input?.remaining === 'number' ? input.remaining : duration;
  const running = typeof input?.running === 'boolean' ? input.running : false;
  const parsedStartTime = typeof input?.startTime === 'number' ? input.startTime : null;
  let startTime = running ? parsedStartTime : null;
  if (running && startTime == null) {
    startTime = now - Math.max(0, duration - remaining) * 1000;
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
    state = deriveRunningState(state, now);
  }
  return state;
}

export function deriveRunningState(state: TimerState, now: number): TimerState {
  if (state.startTime == null) return state;
  const elapsedSeconds = Math.floor((now - state.startTime) / 1000);
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

function transitionPhase(state: TimerState, now: number): TimerState {
  if (state.mode === 'break') {
    return {
      ...state,
      mode: 'work',
      duration: state.workDuration,
      remaining: state.workDuration,
      running: true,
      startTime: now
    };
  }
  return {
    ...state,
    mode: 'break',
    duration: DEFAULT_BREAK_DURATION,
    remaining: DEFAULT_BREAK_DURATION,
    running: true,
    startTime: now
  };
}

function ensureStartTime(state: TimerState, now: number) {
  return state.startTime ?? now - Math.max(0, state.duration - state.remaining) * 1000;
}

export function tickTimer(state: TimerState, now: number): TimerState {
  if (!state.running) return state;
  const startTime = ensureStartTime(state, now);
  const elapsedSeconds = Math.floor((now - startTime) / 1000);
  const remaining = Math.max(0, state.duration - elapsedSeconds);
  if (remaining > 1) {
    return { ...state, remaining, startTime };
  }
  return transitionPhase({ ...state, remaining, startTime }, now);
}

export function startTimer(state: TimerState, now: number): TimerState {
  const startTime = ensureStartTime(state, now);
  return { ...state, running: true, startTime };
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  const remaining =
    state.startTime == null
      ? state.remaining
      : Math.max(0, state.duration - Math.floor((now - state.startTime) / 1000));
  return { ...state, running: false, remaining, startTime: null };
}

export function resetTimer(state: TimerState): TimerState {
  return {
    ...state,
    mode: 'work',
    duration: state.workDuration,
    remaining: state.workDuration,
    running: false,
    startTime: null
  };
}

export function setModeTimer(
  state: TimerState,
  mode: TimerMode,
  duration: number
): TimerState {
  return {
    ...state,
    mode,
    duration,
    remaining: duration,
    running: false,
    startTime: null,
    workDuration: mode === 'break' ? state.workDuration : duration
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function setProgressTimer(
  state: TimerState,
  progress: number,
  now: number
): TimerState {
  const clamped = clamp(progress, 0, 1);
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
  remaining = clamp(remaining, 0, duration);
  const startTime =
    state.running ? now - Math.max(0, duration - remaining) * 1000 : null;
  return { ...state, mode, duration, remaining, startTime };
}
