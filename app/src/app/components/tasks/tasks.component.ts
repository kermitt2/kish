import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { Task } from '../../interfaces/task';
import { TaskService } from '../../services/task.service';
import { ToastrService } from '../../services/toastr.service';
import { TaskdataService } from '../../services/taskdata.service';
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

  @Input() inAnnotationTask: boolean;
  @Output() inAnnotationTaskChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  selectedTask: Task;
  //@Output() selectedTaskChange: EventEmitter<Task> = new EventEmitter<Task>();

  taskProfiles: any[] = [];

  taskProfilesCompleted: any[] = [];
  taskProfilesActive: any[] = [];
  taskProfilesAssigned: any[] = [];

  tasksCompleted: Array<Task>;
  tasksActive: Array<Task>;
  tasksAssigned: Array<Task>;

  constructor(private taskService: TaskService, 
              private toastrService: ToastrService,
              private taskdataService: TaskdataService) { }

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
    return this.taskService.getCompletionNbByLevel(taskItem);
  }

  getTaskStatus(taskItem: Task): string {
    return this.taskService.getTaskStatus(taskItem);
  }

  isRestrictedTask(taskItem: Task): boolean {
    return this.taskService.isRestrictedTask(taskItem, this.userInfo);
  }

  selfAssignTask(task: Task): void {
    this.taskService.selfAssignTask(task["id"])
        .subscribe(
          (data: any) =>  {  // success
            task["assigned"] = this.userInfo["email"];
            task["status"] = "assigned";
            // add redundant tasks
            if (data["records"] && this.userInfo["redundant_tasks"]) {
              let records: any[] = data["records"];
              for (let recordPos: number = 0; recordPos < records.length; recordPos++) {
                const record = records[recordPos];
                if (this.userInfo["redundant_tasks"].indexOf(record) == -1) {
                    this.userInfo["redundant_tasks"].push(record);
                }
              }
            }
          }, 
          (error: any)  =>  this.toastrService.callToaster("toast-top-center", "error", error["message"], "Damn, self-assigning task didn't work!"),
          ()            =>  { 
                              // completed
                              this.toastrService.callToaster("toast-top-center", "success", "", "the task has been assigned to you!");
                              console.log('self-assign task'); 
                            }
       );
  }

  unassignTask(task: Task): void {
    this.taskService.unassignTask(task["id"])
        .subscribe(
          (data: any) =>  {  // success
            task["assigned"] = undefined;
            task["status"] = "unassigned";
            let index: number = this.tasksAssigned.indexOf(task, 0);
            if (index > -1) {
              this.tasksAssigned.splice(index, 1);
            }
            index = this.taskProfilesAssigned.indexOf(task["id"], 0);
            if (index > -1) {
              this.taskProfilesAssigned.splice(index, 1);
            }
            //delete task["assigned"];
            // remove old redundant tasks
            if (data["records"] && this.userInfo["redundant_tasks"]) {
                // remove old redundant tasks
                let records: any[] = data["records"];
                for (let recordPos: number = 0; recordPos < records.length; recordPos++) {
                    const record = records[recordPos];
                    const ind = this.userInfo["redundant_tasks"].indexOf(record);
                    if (ind != -1) {
                        this.userInfo["redundant_tasks"].splice(ind, 1);
                    }
                }
            }
          }, 
          (error: any)   => this.toastrService.callToaster("toast-top-center", "error", error["message"], "Damn, self-unassigning task didn't work!"),
          ()             => { 
                              // completed
                              this.toastrService.callToaster("toast-top-center", "success", "", "the task has been unassigned!");
                              console.log('self-unassign task'); 
                            }
       );
  }
  
  changeValueInAnnotationTask(task: Task) {
    this.inAnnotationTask = true; 
    this.inAnnotationTaskChange.emit(this.inAnnotationTask);

    this.selectedTask = task;
    //this.selectedTaskChange.emit(this.selectedTask);
    this.taskdataService.setTaskdata(this.selectedTask);
  }

  startAnnotationTask(task: Task): void {
    this.changeValueInAnnotationTask(task);
  }
}
