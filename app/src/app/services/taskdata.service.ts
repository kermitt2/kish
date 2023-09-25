import { Injectable } from '@angular/core';
import { Task } from '../interfaces/task';

@Injectable({
  providedIn: 'root'
})
export class TaskdataService {
  selectedTask: Task;

  constructor() { }

  setTaskdata(task: Task) {
    this.selectedTask = task;
  }

  getTaskdata(): Task {
    return this.selectedTask;
  }
}
