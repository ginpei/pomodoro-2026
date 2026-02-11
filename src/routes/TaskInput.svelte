<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';

  const dispatch = createEventDispatcher<{ add: string }>();
  export let disabled = false;

  let newTask = '';
  let newTaskInput: HTMLInputElement;

  async function addTask() {
    if (disabled) return;
    const trimmed = newTask.trim();
    if (!trimmed) return;
    dispatch('add', trimmed);
    newTask = '';
    await tick();
    newTaskInput?.focus();
  }
</script>

<div class="flex gap-2 mb-4">
  <input
    class="flex-1 border rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
    placeholder="Add new task"
    bind:value={newTask}
    bind:this={newTaskInput}
    on:keydown={(e) => e.key === 'Enter' && addTask()}
    disabled={disabled}
  />
  <button
    class="bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-blue-300"
    on:click={addTask}
    disabled={disabled}
  >
    Add
  </button>
</div>
