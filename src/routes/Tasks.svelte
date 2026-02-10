<script lang="ts">
  import { taskStore, type Task } from '$lib/tasks';
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import TaskInput from './TaskInput.svelte';
  import TaskList from './TaskList.svelte';

  const initial = get(taskStore);
  let taskList: Task[] = initial.tasks;
  let activeTaskId: string | null = initial.selectedTaskId;
  let hydrated = false;
  const unsubTasks = taskStore.subscribe(v => {
    taskList = v.tasks;
    activeTaskId = v.selectedTaskId;
  });

  onMount(() => {
    hydrated = true;
  });

  onDestroy(() => {
    unsubTasks();
  });

  function handleAdd(event: CustomEvent<string>) {
    taskStore.addTask(event.detail);
  }

  function handleEdit(event: CustomEvent<{ id: string; name: string }>) {
    taskStore.editTask(event.detail.id, event.detail.name);
  }

  function handleDelete(event: CustomEvent<string>) {
    taskStore.deleteTask(event.detail);
  }

  function handleSelect(event: CustomEvent<string | null>) {
    taskStore.selectTask(event.detail);
  }

  function handleReorder(event: CustomEvent<{ id: string; toIndex: number }>) {
    taskStore.reorderTask(event.detail.id, event.detail.toIndex);
  }
</script>

<div class="mt-6 w-full max-w-xs mx-auto">
  <h2 class="text-lg font-bold mb-2">Tasks</h2>
  <TaskInput on:add={handleAdd} />
  <TaskList
    tasks={taskList}
    activeTaskId={activeTaskId}
    hydrated={hydrated}
    on:edit={handleEdit}
    on:delete={handleDelete}
    on:select={handleSelect}
    on:reorder={handleReorder}
  />
</div>
