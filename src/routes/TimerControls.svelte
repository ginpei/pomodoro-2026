<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let running = false;

  const dispatch = createEventDispatcher<{
    start: void;
    pause: void;
    reset: void;
  }>();

  function handleStart() {
    dispatch('start');
  }

  function handlePause() {
    dispatch('pause');
  }

  function handleReset() {
    dispatch('reset');
  }
</script>

<div class="flex gap-2">
  <button
    class="px-4 py-2 rounded bg-green-500 text-white disabled:bg-green-200"
    on:click={handleStart}
    disabled={running}
  >
    Start
  </button>
  <button
    class="px-4 py-2 rounded bg-yellow-500 text-white disabled:bg-yellow-200"
    on:click={handlePause}
    disabled={!running}
  >
    Pause
  </button>
  <button class="px-4 py-2 rounded bg-red-500 text-white" on:click={handleReset}>
    Reset
  </button>
</div>
