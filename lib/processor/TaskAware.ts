import { Task } from "nx/src/config/task-graph";

let currentTask: Task = null as any;

export const setCurrentTask = (task: Task) => {
  currentTask = task;
}

export const getCurrentTask = () => currentTask;

export const wrapTaskAware = (task: Task): Task => ({
  ...task,
  get hash() {
    setCurrentTask(task);
    return task.hash;
  },
  set hash(tmp) {
    setCurrentTask(task);
    task.hash = tmp;
  }
} as Task);