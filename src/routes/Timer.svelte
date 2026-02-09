<script lang="ts">
  import { timer } from '$lib/timer';
  import { taskStore, type Task } from '$lib/tasks';
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import TimerControls from './TimerControls.svelte';
  import TimerDial from './TimerDial.svelte';

  let timerValue = get(timer);
  let taskState = get(taskStore);
  let activeTask: Task | null = null;
  let hydrated = false;

  onMount(() => {
    timer.restore();
    hydrated = true;
  });

  const unsubscribe = timer.subscribe(value => timerValue = value);
  const unsubscribeTasks = taskStore.subscribe(value => taskState = value);

  onDestroy(() => {
    unsubscribe();
    unsubscribeTasks();
  });

  $: activeTask = taskState.tasks.find(task => task.id === taskState.selectedTaskId) ?? null;

  function start() {
    timer.start();
  }

  function pause() {
    timer.pause();
  }

  function reset() {
    timer.reset();
  }

  function setProgress(event: CustomEvent<number>) {
    timer.setProgress(event.detail);
  }
</script>

{#if !hydrated}
  <div class="flex flex-col items-center gap-4">
    <svg width="160" height="160" viewBox="0 0 160 160" class="mb-2 animate-pulse">
      <circle
        cx="80" cy="80" r="70"
        fill="none"
        stroke="#d1d5db"
        stroke-width="12"
      />
    </svg>
    <div class="flex gap-2">
      <button class="px-4 py-2 rounded bg-green-500 text-white disabled:bg-green-200 disabled:opacity-60" disabled>Start</button>
      <button class="px-4 py-2 rounded bg-yellow-500 text-white disabled:bg-yellow-200 disabled:opacity-60" disabled>Pause</button>
      <button class="px-4 py-2 rounded bg-red-500 text-white disabled:opacity-60" disabled>Reset</button>
    </div>
    <div class="text-gray-300 animate-pulse">Task: --</div>
  </div>
{:else}
  <div class="flex flex-col items-center gap-4">
    <TimerDial value={timerValue} on:setProgress={setProgress} />
    <TimerControls running={timerValue.running} on:start={start} on:pause={pause} on:reset={reset} />
    <div class="text-sm text-gray-700">Task: {activeTask ? activeTask.name : 'None'}</div>
  </div>
{/if}
