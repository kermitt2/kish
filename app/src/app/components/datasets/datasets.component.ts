import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { Task } from '../../interfaces/task';
import { TaskService } from '../../services/task.service';
import { DatasetService } from '../../services/dataset.service';
import { ToastrService } from '../../services/toastr.service';
import { TaskdataService } from '../../services/taskdata.service';
import { Observable } from 'rxjs';    
import { MainComponent} from '../main/main.component';
import { TasksComponent} from '../tasks/tasks.component';
import { User } from '../../interfaces/user';
import { Dataset } from '../../interfaces/dataset';

@Component({
  selector: 'app-datasets',
  templateUrl: './datasets.component.html',
  styleUrls: ['./datasets.component.css']
})
export class DatasetsComponent implements OnInit {
  @Input() userInfo: User;

  @Input() inAnnotationTask: boolean;
  @Output() inAnnotationTaskChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  selectedTask: Task;
  @Output() selectedTaskChange: EventEmitter<Task> = new EventEmitter<Task>();

  datasetProfiles: string[] = [];
  datasets: Array<Dataset>;

  constructor(private datasetService: DatasetService, 
              private taskService: TaskService, 
              private toastrService: ToastrService,
              private taskdataService: TaskdataService) { }

  ngOnInit(): void {
    this.setDatasetProfiles();
  }

  setDatasetProfiles(): void {
    this.datasetService.getDatasets()
        .subscribe(
          (data: any) =>  {  // success
            this.datasetProfiles = data["records"];
            this.datasets = new Array<Dataset>(this.datasetProfiles.length);
            for (let i=0; i< this.datasetProfiles.length; i++) {
              this.setDataset(this.datasetProfiles[i], i);
            }
          }, 
          (error: any)   => console.log(error), // error
          ()             => { console.log('all dataset id get'); } // completed
       );
  }

  setDataset(dataset_id: string, index: number): void {
    this.datasetService.getDataset(dataset_id)
        .subscribe(
          (data: any) =>  {  // success
            this.datasets[index] = data["record"];
            this.setDatasetTasks(dataset_id, index);
          }, 
          (error: any)   => console.log(error), // error
          ()             => console.log('dataset id get') // completed
       );
  }

  setDatasetTasks(dataset_id: string, index: number): void {
    this.datasetService.getDatasetTasks(dataset_id)
        .subscribe(
          (data: any) =>  {  // success
            this.datasets[index]["tasks"] = data["records"];
          }, 
          (error: any)   => console.log(error), // error
          ()             => console.log('dataset tasks get') // completed
       );
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
          (error: any)   => this.toastrService.callToaster("toast-top-center", "error", error["message"], "Damn, self-assigning task didn't work!"),
          ()             => { 
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

  getCompletionNbByLevel(taskItem: Task): string {
    return this.taskService.getCompletionNbByLevel(taskItem);
  }

  getTaskStatus(taskItem: Task): string {
    return this.taskService.getTaskStatus(taskItem);
  }

  isRestrictedTask(taskItem: Task): boolean {
    return this.taskService.isRestrictedTask(taskItem, this.userInfo);
  }

}
