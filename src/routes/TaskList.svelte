<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import type { Task } from '$lib/tasks';

  import type { TaskStateName } from '$lib/tasks';
  export let tasks: Task[] = [];
  export let activeTaskId: string | null = null;
  export let hydrated = false;

  const GROUPS: TaskStateName[] = ['complete', 'in progress', 'todo', 'later'];

  function capitalize(s: string) {
    return s.replace(/\b\w/g, c => c.toUpperCase());
  }

  // Flat list for rendering: group titles and tasks
  $: groupedList = GROUPS.flatMap(group => [
    { type: 'group', group },
    ...tasks.filter(task => task.state === group).map(task => ({ type: 'task', task }))
  ]);

  let dragOverGroup: TaskStateName | null = null;


  const dispatch = createEventDispatcher<{
    select: string | null;
    edit: { id: string; name: string };
    delete: string;
    move: { id: string; toId: string | null; newState: TaskStateName; after?: boolean };
  }>();

  let editingId: string | null = null;
  let editingName = '';
  let editInputs: Record<string, HTMLInputElement> = {};
  let draggingId: string | null = null;
  let dragOverId: string | null = null;
  let dragOverAfter = false;
  let draggingIndex = -1;
  let dragOverIndex = -1;
  let isMovingDown = false;

  $: draggingIndex = draggingId ? tasks.findIndex(task => task.id === draggingId) : -1;
  $: dragOverIndex = dragOverId ? tasks.findIndex(task => task.id === dragOverId) : -1;
  $: isMovingDown = draggingIndex >= 0 && dragOverIndex >= 0 && draggingIndex < dragOverIndex;

  async function startEdit(id: string, name: string) {
    editingId = id;
    editingName = name;
    await tick();
    const input = editInputs[id];
    if (input) {
      input.focus();
      input.select();
    }
  }

  function saveEdit(id: string) {
    if (editingName.trim()) {
      dispatch('edit', { id, name: editingName.trim() });
      editingId = null;
      editingName = '';
    }
  }

  function cancelEdit() {
    editingId = null;
    editingName = '';
  }

  function deleteTask(id: string) {
    dispatch('delete', id);
  }

  function toggleSelect(id: string) {
    dispatch('select', activeTaskId === id ? null : id);
  }

  function startDrag(event: PointerEvent, id: string) {
    if (editingId) {
      return;
    }
    // Prevent dragging group titles
    const item = groupedList.find(x => x.type === 'task' && x.task.id === id);
    if (!item) return;
    draggingId = id;
    dragOverId = id;
    dragOverGroup = null;
    const handle = event.currentTarget as HTMLElement | null;
    handle?.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function updateDragTarget(event: PointerEvent) {
    if (!draggingId) {
      return;
    }
    const target = document.elementFromPoint(event.clientX, event.clientY);
    // Detect drop target on tasks or group titles
    const item = target?.closest?.('li[data-task-id]') as HTMLElement | null;
    const taskId = item?.dataset?.taskId;
    if (taskId) {
      dragOverId = taskId;
      dragOverGroup = null;
      const rect = item?.getBoundingClientRect();
      if (rect) {
        dragOverAfter = event.clientY > rect.top + rect.height / 2;
      }
    } else {
      const groupItem = target?.closest?.('li[data-group-title]') as HTMLElement | null;
      const group = groupItem?.dataset?.groupTitle as TaskStateName | undefined;
      if (group) {
        dragOverGroup = group;
        dragOverId = null;
      }
    }
    event.preventDefault();
  }

  function finishDrag() {
    if (!draggingId) {
      return;
    }
    const fromId = draggingId;
    const toId = dragOverId;
    const toAfter = dragOverAfter;
    const toGroup = dragOverGroup;
    draggingId = null;
    dragOverId = null;
    dragOverGroup = null;
    if (toGroup) {
      dispatch('move', { id: fromId, toId: null, newState: toGroup });
      return;
    }
    if (!toId || fromId === toId) {
      return;
    }
    // Find group of drop target
    const toIdx = groupedList.findIndex(x => x.type === 'task' && x.task.id === toId);
    if (toIdx < 0) return;
    // Find the group title above drop target
    let group = 'todo';
    for (let i = toIdx; i >= 0; --i) {
      if (groupedList[i].type === 'group') {
        group = groupedList[i].group;
        break;
      }
    }
    dispatch('move', { id: fromId, toId, newState: group, after: toAfter });
  }
</script>

<ul class:select-none={draggingId != null}>
  {#if !hydrated}
    {#each Array(3) as _}
      <li class="flex items-center gap-2 mb-2 animate-pulse">
        <span class="flex-1 h-6 bg-gray-300 rounded"></span>
        <span class="w-16 h-6 bg-gray-300 rounded"></span>
        <span class="w-16 h-6 bg-gray-300 rounded"></span>
      </li>
    {/each}
  {:else}
    {#each groupedList as item, i}
      {#if item.type === 'group'}
        <li
          class="font-bold text-gray-700 select-none cursor-default opacity-80"
          aria-disabled="true"
          data-group-title={item.group}
        >
          {capitalize(item.group)}
        </li>
        {#if draggingId != null && dragOverGroup === item.group}
          <li class="mb-2">
            <div class="h-0.5 bg-blue-500 rounded"></div>
          </li>
        {/if}
      {:else}
        {#if draggingId != null && dragOverId === item.task.id && draggingId !== item.task.id && !dragOverAfter}
          <li class="mb-2">
            <div class="h-0.5 bg-blue-500 rounded"></div>
          </li>
        {/if}
        <li
          class="flex items-center gap-2 mb-2"
          class:opacity-60={draggingId === item.task.id}
          data-task-id={item.task.id}
        >
          {#if editingId === item.task.id}
            <input
              class="flex-1 border rounded px-2 py-1"
              bind:value={editingName}
              bind:this={editInputs[item.task.id]}
              on:keydown={(e) => e.key === 'Enter' && saveEdit(item.task.id)}
            />
            <button class="bg-green-500 text-white px-2 py-1 rounded" on:click={() => saveEdit(item.task.id)}>
              Save
            </button>
            <button class="bg-gray-400 text-white px-2 py-1 rounded" on:click={cancelEdit}>
              Cancel
            </button>
          {:else}
            <button
              class={`px-2 py-1 rounded text-gray-600 touch-none ${draggingId === item.task.id ? 'cursor-grabbing' : 'cursor-grab'}`}
              type="button"
              aria-label="Reorder task"
              disabled={editingId != null}
              on:pointerdown={(event) => startDrag(event, item.task.id)}
              on:pointermove={updateDragTarget}
              on:pointerup={finishDrag}
              on:pointercancel={finishDrag}
            >
              ::
            </button>
            <span class="flex-1">{item.task.name}</span>
            <button
              class={`px-2 py-1 rounded text-white ${activeTaskId === item.task.id ? 'bg-blue-600' : 'bg-blue-500'}`}
              on:click={() => toggleSelect(item.task.id)}
            >
              {activeTaskId === item.task.id ? 'Active' : 'Select'}
            </button>
            <button class="bg-yellow-500 text-white px-2 py-1 rounded" on:click={() => startEdit(item.task.id, item.task.name)}>
              Edit
            </button>
            <button class="bg-red-500 text-white px-2 py-1 rounded" on:click={() => deleteTask(item.task.id)}>
              Delete
            </button>
          {/if}
        </li>
        {#if draggingId != null && dragOverId === item.task.id && draggingId !== item.task.id && dragOverAfter}
          <li class="mb-2">
            <div class="h-0.5 bg-blue-500 rounded"></div>
          </li>
        {/if}
      {/if}
    {/each}
  {/if}
</ul>
