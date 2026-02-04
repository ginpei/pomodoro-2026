import { writable, type Writable } from 'svelte/store';

export interface Task {
  id: string;
  name: string;
}

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
