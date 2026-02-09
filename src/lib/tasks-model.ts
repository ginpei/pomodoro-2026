export interface Task {
  id: string;
  name: string;
}

export interface TaskState {
  tasks: Task[];
  selectedTaskId: string | null;
}

export function normalizeTaskState(input?: Partial<TaskState>): TaskState {
  const tasks = Array.isArray(input?.tasks) ? input!.tasks : [];
  const selectedTaskId =
    typeof input?.selectedTaskId === 'string' ? input.selectedTaskId : null;
  const hasSelected = selectedTaskId != null && tasks.some(task => task.id === selectedTaskId);
  return {
    tasks,
    selectedTaskId: hasSelected ? selectedTaskId : null
  };
}

export function addTask(state: TaskState, name: string, id: string): TaskState {
  return { ...state, tasks: [...state.tasks, { id, name }] };
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
  return normalizeTaskState({ tasks, selectedTaskId: state.selectedTaskId });
}
