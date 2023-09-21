import { Injectable } from '@angular/core';
import { Task } from '../interfaces/task';
import { User } from '../interfaces/user';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  //end-point url 
  base_url: string = 'http://0.0.0.0:8050';

  constructor(private http: HttpClient) { }

  defineBaseURL(ext: string): string {
    let localBase: string = this.base_url;
    if (!localBase.endsWith("/")) {
        localBase = localBase + "/";
    }
    if (ext != null)
        localBase += ext;
    return localBase
  }

  /** 
   * Retrieve the existing task information assigned to the current user 
   **/
  getTasks(): Observable<any> {
    let url: string = this.defineBaseURL("tasks/user");
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    return this.http.get<any>(url, {headers: headers, withCredentials: true});
  }

  getTask(task_id: string): Observable<Task> {
    let url: string = this.defineBaseURL("tasks/"+task_id);
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    return this.http.get<Task>(url, {headers: headers, withCredentials: true});
  }

  unassignTask(taskIdentifier: string): Observable<any> {
    let url: string = this.defineBaseURL("tasks/"+taskIdentifier+"/assign");
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    return this.http.delete<any>(url, {headers: headers, withCredentials: true});
  }

  selfAssignTask(taskIdentifier: string): Observable<any> {
    let url: string = this.defineBaseURL("tasks/"+taskIdentifier+"/assign");
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    return this.http.post<any>(url, null, {headers: headers, withCredentials: true});
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

  isRestrictedTask(taskItem: Task, userInfo: User): boolean {
    return (
        (userInfo["redundant_tasks"] && userInfo["redundant_tasks"].indexOf(taskItem["id"]) != -1 && taskItem["type"] !== "reconciliation") ||
        (userInfo["role"] === "annotator" && taskItem["type"] === "reconciliation")
    );
  }

}
