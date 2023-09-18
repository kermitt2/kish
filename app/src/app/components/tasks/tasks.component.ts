import { Component, OnInit, Input } from '@angular/core';
import { Task } from '../../interfaces/task';
import { TaskService } from '../../services/task.service';
import { ToastrService } from '../../services/toastr.service';
import { Observable } from 'rxjs';    
import { MainComponent} from '../main/main.component';
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit {
  
  @Input() userInfo: User;

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
          (data: any) =>  {  // success
            tasks[index] = data["record"];
          }, 
          (error: any)   => console.log(error), // error
          ()             => console.log('task id get') // completed
       );
  }

  getCompletionNbByLevel(taskItem: Task): string {
    let taskContent: string = ""

    if (taskItem == null || taskItem == undefined) 
      return taskContent;

    if (taskItem["level"] === "document") {
        if (taskItem["nb_completed_documents"]) {
            if (taskItem["nb_documents"])
                taskContent += taskItem["nb_completed_documents"] + " / " + taskItem["nb_documents"] + " doc.";
            else
                taskContent += taskItem["nb_completed_documents"] + " doc.";
        } else 
            taskContent = "0";
    } else {
        if (taskItem["nb_completed_excerpts"]) {
            if (taskItem["nb_excerpts"])
                taskContent = taskItem["nb_completed_excerpts"] + " / " + taskItem["nb_excerpts"] + " excepts";
            else
                taskContent = taskItem["nb_completed_excerpts"] + " excerpt";
        } else
            taskContent = "0";
    }
    return taskContent;
  }

  getTaskStatus(taskItem: Task): string {
    let taskContent: string = "";
    if (taskItem == null || taskItem == undefined) 
      return taskContent;

    if (taskItem["status"]) 
        taskContent = taskItem["status"];
    else
        taskContent = "unknown";
    return taskContent;
  }

  isRestrictedTask(taskItem: Task): boolean {
    return (
        (this.userInfo["redundant_tasks"] && this.userInfo["redundant_tasks"].indexOf(taskItem["id"]) != -1 && taskItem["type"] !== "reconciliation") ||
        (this.userInfo["role"] === "annotator" && taskItem["type"] === "reconciliation")
    );
  }

}
