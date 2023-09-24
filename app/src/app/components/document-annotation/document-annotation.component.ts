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

import * as $ from 'jquery';

//import * as annotationTask from 'assets/js/legacy/task'
declare var annotationTask: any;
//declare var setTaskInfo: any;

@Component({
  selector: 'app-document-annotation',
  templateUrl: './document-annotation.component.html',
  styleUrls: ['./document-annotation.component.css']
})
export class DocumentAnnotationComponent {
  @Input() userInfo: User;
  selectedTask: Task;

  constructor(private datasetService: DatasetService, 
              private taskService: TaskService, 
              private toastrService: ToastrService,
              private taskdataService: TaskdataService) { }

  ngOnInit(): void {
    this.selectedTask = this.taskdataService.getTaskdata();
    this.startAnnotationTask();
  }

  startAnnotationTask(): void {

    //this.changeValueInAnnotationTask();
    this.setTaskInfo(this.selectedTask);

    annotationTask(this.userInfo, this.selectedTask);

    /*
    
    // get the list of excerpt identifiers for the tasks
    var url = defineBaseURL("tasks/"+taskInfo["id"]+"/excerpts");
    if (taskInfo["level"] === "document")
        url = defineBaseURL("tasks/"+taskInfo["id"]+"/documents");

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onloadend = function () {
        var response = JSON.parse(xhr.responseText);
        if (xhr.status == 401) {
            window.location.href = "sign-in.html";
        } else if (xhr.status != 200) {
            // display server level error
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, accessing excepts of the task failed!");
        } else {
            if (taskInfo["level"] === "document") {
                var documents = []
                for (var documentPos in response["records"]["documents"]) {
                    documents.push(response["records"][documentPos]);
                }
                taskInfo["documents"] = documents;

                if(response["records"].hasOwnProperty('first_non_complete'))
                    taskInfo["first_non_complete"] = response["records"]["first_non_complete"];
                else
                    taskInfo["first_non_complete"] = taskInfo["nb_documents"]-1;
            } else {
                var excerpts = []
                for (var excerptPos in response["records"]["excerpts"]) {
                    excerpts.push(response["records"][excerptPos]);
                }
                taskInfo["excerpts"] = excerpts;

                if(response["records"].hasOwnProperty('first_non_complete'))
                    taskInfo["first_non_complete"] = response["records"]["first_non_complete"];
                else
                    taskInfo["first_non_complete"] = taskInfo["nb_excerpts"]-1;
            }
            getTaskLabels(userInfo, taskInfo);
        }
    }
    xhr.send(null);
    */
  }

  setTaskInfo(taskInfo: Task): void {

    console.log(taskInfo);

    if (taskInfo == null) {
        $("#annotation-task-info").html("The task is not available");
    } else {
        var taskContent;

        const taskInfoTemplate = "<table style=\"width:100%;\"><tr> \
                        <td style=\"width:15%;font-size:100%;\"><span style=\"color:grey\">Progress:</span> \
                        <span id=\"progress-done\">{{nb_completed_excerpts}}</span> / \
                         {{nb_excerpts}} <span id=\"progress-complete\"></span> </td> \
                        <td style=\"width:20%;\"><span style=\"color:grey\">Task:</span> {{name}} </td> \
                        <td style=\"width:10%;\"><span style=\"color:grey\">Type:</span> {{type}} </td> \
                        <td style=\"width:15%;\"><span style=\"color:grey\">Dataset:</span> {{dataset_name}} </td> \
                        <td style=\"width:10%;\"><span style=\"color:grey\">Task doc.:</span> {{nb_documents}} </td> \
                        <td style=\"width:30%;text-align:right;\"> \
                        <button class=\"mb-1 btn-sm btn-validate-doc\" style=\"display: none;\" id=\"button-document-validation\">Validate doc.</button> \
                        <button class=\"mb-1 btn-sm btn-update-doc\" style=\"display: none;\" id=\"button-document-update\">Update doc.</button> \
                        <button class=\"mb-1 btn-sm btn-ignore-doc\" style=\"display: none;\" id=\"button-document-ignore\">Ignore doc.</button> \
                        <button class=\"mb-1 btn-sm btn-next-doc\" style=\"display: none;\" id=\"previousDocumentButton\">Previous doc.</button> \
                        <button class=\"mb-1 btn-sm btn-next-doc\" style=\"display: none;\" id=\"nextDocumentButton\">Next doc.</button></td> \
                        </tr></table>";

        if (taskInfo["level"] === "document") {
            taskContent = taskInfoTemplate
                    .replace("{{nb_completed_excerpts}}", ""+taskInfo["nb_completed_documents"])
                    .replace("{{nb_excerpts}}", ""+taskInfo["nb_documents"]);
            if (taskInfo["nb_completed_documents"] === taskInfo["nb_documents"]) {
                $("#progress-complete").html("<span style=\"color: green;\">Completed !</span>");
            }
        } else {
            taskContent = taskInfoTemplate
                    .replace("{{nb_completed_excerpts}}", ""+taskInfo["nb_completed_excerpts"])
                    .replace("{{nb_excerpts}}", ""+taskInfo["nb_excerpts"]);
            if (taskInfo["nb_completed_excerpts"] === taskInfo["nb_excerpts"]) {
                $("#progress-complete").html("<span style=\"color: green;\">Completed !</span>");
            }
        }
        
        if (taskInfo["name"])
            taskContent = taskContent.replace("{{name}}", taskInfo["name"]);
        if (taskInfo["type"])
            taskContent = taskContent.replace("{{type}}", taskInfo["type"]);
        if (taskInfo["dataset_name"])
            taskContent = taskContent.replace("{{dataset_name}}", taskInfo["dataset_name"]);
        if (taskInfo["nb_documents"])
            taskContent = taskContent.replace("{{nb_documents}}", ""+taskInfo["nb_documents"]);
        
        $("#annotation-task-info").html(taskContent);

        if (taskInfo["level"] === "document") {
            if (taskInfo["nb_completed_documents"] === taskInfo["nb_documents"]) {
                $("#progress-complete").html("<span style=\"color: green;\">Completed !</span>");
            }
        } else {
            if (taskInfo["nb_completed_excerpts"] === taskInfo["nb_excerpts"]) {
                $("#progress-complete").html("<span style=\"color: green;\">Completed !</span>");
            }
        }
    }
  }

}
