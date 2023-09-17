import { Component, OnInit } from '@angular/core';
import { Task } from '../../interfaces/task';
import { TaskService } from '../../services/task.service';
import { ToastrService } from '../../services/toastr.service';
import { Observable } from 'rxjs';    

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit {
  taskProfiles: any[] = [];

  taskProfilesCompleted: any[] = [];
  taskProfilesActive: any[] = [];
  taskProfilesAssigned: any[] = [];

  tasksCompleted: Array<Task>;
  tasksActive: Array<Task>;
  tasksAssigned: Array<Task>;

  constructor(private taskService: TaskService, private toastrService: ToastrService) { }

  ngOnInit(): void {
    this.setTaskProfiles();
  }

  filterCompletedTasks(): void {
    this.taskProfilesCompleted = this.taskProfiles.filter(p => (p.is_completed == 1));
    this.tasksCompleted = new Array<Task>(this.taskProfilesCompleted.length);
    for (let i=0; i< this.taskProfilesCompleted.length; i++) {
      this.setTask(this.tasksCompleted, this.taskProfilesCompleted[i]["task_id"], i);
    }
  }

  filterActiveTasks(): void {
    this.taskProfilesActive = this.taskProfiles.filter(p => ( 
      p.is_completed == 0 && 
      (p.in_progress == 1 || p.nb_completed_excerpts > 0)
      ));
    this.tasksActive = new Array<Task>(this.taskProfilesActive.length);
    for (let i=0; i< this.taskProfilesActive.length; i++) {
      this.setTask(this.tasksActive, this.taskProfilesActive[i]["task_id"], i);
    }
  }

  filterAssignedTasks(): void {
    this.taskProfilesAssigned =  this.taskProfiles.filter(p => (
        p.is_completed == 0 && 
        (p.in_progress == 0 || p.nb_completed_excerpts == 0)
        ));
    this.tasksAssigned = new Array<Task>(this.taskProfilesAssigned.length);
    for (let i=0; i< this.taskProfilesAssigned.length; i++) {
      this.setTask(this.tasksAssigned, this.taskProfilesAssigned[i]["task_id"], i);
    }
  }

  setTaskProfiles(): void {
    this.taskService.getTasks()
        .subscribe(
          (data: any) =>  {  // success
            this.taskProfiles = data["records"];
            this.filterActiveTasks();
            this.filterAssignedTasks();
            this.filterCompletedTasks();
          }, 
          (error: any)   => console.log(error), // error
          ()             => { console.log('all task id get'); } // completed
       );
  }

  setTask(tasks: Array<Task>, task_id: string, index: number): void {
    this.taskService.getTask(task_id)
        .subscribe(
          (data: Task) =>  {  // success
            tasks[index] = data;
          }, 
          (error: any)   => console.log(error), // error
          ()             => console.log('task id get') // completed
       );
  }

  /*trackTask(index: number, element: any): any {
    console.log(element);
    return element ? element.id : null;
  }*/

}
