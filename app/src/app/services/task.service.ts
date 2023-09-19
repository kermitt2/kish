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

  unassignTask(userInfo: User, taskIdentifier: string): Observable<any> {
    let url: string = this.defineBaseURL("tasks/"+taskIdentifier+"/assign");
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    return this.http.delete<any>(url, {headers: headers, withCredentials: true});
  }

  assignTask(taskIdentifier: string): Observable<any> {
    let url: string = this.defineBaseURL("tasks/"+taskIdentifier+"/assign");
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    return this.http.post<any>(url, null, {headers: headers, withCredentials: true});
  }

}
