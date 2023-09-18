import { Component, OnInit, Input } from '@angular/core';
import { Task } from '../../interfaces/task';
import { TaskService } from '../../services/task.service';
import { DatasetService } from '../../services/dataset.service';
import { ToastrService } from '../../services/toastr.service';
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

  datasetProfiles: string[] = [];
  datasets: Array<Dataset>;

  constructor(private datasetService: DatasetService, private toastrService: ToastrService) { }

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
