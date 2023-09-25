import { Injectable } from '@angular/core';
import { Dataset } from '../interfaces/dataset';
import { ApiBaseService } from './api-base.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DatasetService {

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

  /** 
   * Retrieve the existing dataset information 
   **/
  getDatasets(): Observable<any> {
    let url: string = this.defineBaseURL("datasets");
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    return this.http.get<any>(url, {headers: headers, withCredentials: true});
  }

  getDataset(dataset_id: string): Observable<Dataset> {
    let url: string = this.defineBaseURL("datasets/"+dataset_id);
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    return this.http.get<Dataset>(url, {headers: headers, withCredentials: true});
  }

  getDatasetTasks(dataset_id: string): Observable<any> {
    let url: string = this.defineBaseURL("tasks/dataset/"+dataset_id);
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    return this.http.get<any>(url, {headers: headers, withCredentials: true});
  }

  getDatasetMetrics(dataset_id: string): Observable<any> {
    let url: string = this.defineBaseURL("datasets/"+dataset_id+"/metrics");
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    return this.http.get<any>(url, {headers: headers, withCredentials: true});
  }

}
