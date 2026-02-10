export type TaskStateName = 'complete' | 'in progress' | 'todo' | 'later';

export interface Task {
  id: string;
  name: string;
  state: TaskStateName;
}

export interface TaskState {
  tasks: Task[];
  selectedTaskId: string | null;
}

export function normalizeTaskState(input?: Partial<TaskState>): TaskState {
  const tasks = Array.isArray(input?.tasks)
    ? input!.tasks.map(task => ({ ...task, state: task.state ?? 'todo' }))
    : [];
  const selectedTaskId =
    typeof input?.selectedTaskId === 'string' ? input.selectedTaskId : null;
  const hasSelected = selectedTaskId != null && tasks.some(task => task.id === selectedTaskId);
  return {
    tasks,
    selectedTaskId: hasSelected ? selectedTaskId : null
  };
}

export function addTask(state: TaskState, name: string, id: string, taskState: TaskStateName = 'todo'): TaskState {
  return { ...state, tasks: [...state.tasks, { id, name, state: taskState }] };
}

export function editTask(state: TaskState, id: string, name: string): TaskState {
  return {
    ...state,
    tasks: state.tasks.map(task => (task.id === id ? { ...task, name } : task))
  };
}

export function deleteTask(state: TaskState, id: string): TaskState {
  const tasks = state.tasks.filter(task => task.id !== id);
  const selectedTaskId = state.selectedTaskId === id ? null : state.selectedTaskId;
  return { tasks, selectedTaskId };
}

export function selectTask(state: TaskState, id: string | null): TaskState {
  if (id == null) {
    return { ...state, selectedTaskId: null };
  }
  const exists = state.tasks.some(task => task.id === id);
  return { ...state, selectedTaskId: exists ? id : null };
}

export function setTasks(state: TaskState, tasks: Task[]): TaskState {
  // Ensure all tasks have a state property
  const normalized = tasks.map(task => ({ ...task, state: task.state ?? 'todo' }));
  return normalizeTaskState({ tasks: normalized, selectedTaskId: state.selectedTaskId });
}

export function reorderTasks(state: TaskState, taskId: string, toIndex: number): TaskState {
  const fromIndex = state.tasks.findIndex(task => task.id === taskId);
  if (fromIndex < 0) {
    return state;
  }
  const clampedIndex = Math.max(0, Math.min(toIndex, state.tasks.length - 1));
  if (fromIndex === clampedIndex) {
    return state;
  }
  const tasks = [...state.tasks];
  const [moved] = tasks.splice(fromIndex, 1);
  tasks.splice(clampedIndex, 0, moved);
  return { ...state, tasks };
}

export function setTaskState(state: TaskState, id: string, newState: TaskStateName): TaskState {
  return {
    ...state,
    tasks: state.tasks.map(task => (task.id === id ? { ...task, state: newState } : task))
  };
}
