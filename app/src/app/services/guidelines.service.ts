import { Injectable } from '@angular/core';
import { ApiBaseService } from './api-base.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GuidelinesService {

  constructor(private http: HttpClient, private apiBaseService: ApiBaseService) { }

  defineBaseURL(ext: string): string {
    let localBase: string = this.apiBaseService.getApiBase();
    if (!localBase.endsWith("/")) {
        localBase = localBase + "/";
    }
    if (ext != null)
        localBase += ext;
    return localBase;
  }

  getGuidelines(taskId: string): Observable<any> {
    let url: string = this.defineBaseURL("tasks/"+taskId+"/guidelines");
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    return this.http.get<any>(url, {headers: headers, withCredentials: true});
  }

}
