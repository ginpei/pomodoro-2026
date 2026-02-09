import { get, writable, type Writable } from 'svelte/store';

export interface Task {
  id: string;
  name: string;
}

const SELECTED_TASK_KEY = 'pomodoro-selected-task';

function createSelectedTaskId() {
  let initial: string | null = null;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(SELECTED_TASK_KEY);
    initial = stored ? stored : null;
  }
  const { subscribe, set }: Writable<string | null> = writable(initial);

  if (typeof window !== 'undefined') {
    subscribe(value => {
      if (value) {
        localStorage.setItem(SELECTED_TASK_KEY, value);
      } else {
        localStorage.removeItem(SELECTED_TASK_KEY);
      }
    });
  }

  return { subscribe, set };
}

export const selectedTaskId = createSelectedTaskId();

function createTasks() {
  let initial: Task[] = [];
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('tasks');
    initial = stored ? JSON.parse(stored) : [];
  }
  const { subscribe, update, set }: Writable<Task[]> = writable(initial);

  if (typeof window !== 'undefined') {
    subscribe(tasks => {
      localStorage.setItem('tasks', JSON.stringify(tasks));
      const selected = get(selectedTaskId);
      if (selected && !tasks.some(task => task.id === selected)) {
        selectedTaskId.set(null);
      }
    });
  }

  function addTask(name: string) {
    update(tasks => [...tasks, { id: crypto.randomUUID(), name }]);
  }

  function editTask(id: string, name: string) {
    update(tasks => tasks.map(t => t.id === id ? { ...t, name } : t));
  }

  function deleteTask(id: string) {
    update(tasks => tasks.filter(t => t.id !== id));
  }

  return { subscribe, addTask, editTask, deleteTask, set };
}

export const tasks = createTasks();
