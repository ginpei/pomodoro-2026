<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';

  const dispatch = createEventDispatcher<{ add: string }>();

  let newTask = '';
  let newTaskInput: HTMLInputElement;

  async function addTask() {
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
    class="flex-1 border rounded px-2 py-1"
    placeholder="Add new task"
    bind:value={newTask}
    bind:this={newTaskInput}
    on:keydown={(e) => e.key === 'Enter' && addTask()}
  />
  <button class="bg-blue-500 text-white px-3 py-1 rounded" on:click={addTask}>
    Add
  </button>
</div>
