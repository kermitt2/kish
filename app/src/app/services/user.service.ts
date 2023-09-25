import { Injectable } from '@angular/core';
import { User } from '../interfaces/user';
import { ApiBaseService } from './api-base.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import * as $ from 'jquery';

@Injectable({
  providedIn: 'root'
})
export class UserService {

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

  getUsers(): Observable<any> {
    let url: string = this.defineBaseURL("users");
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    return this.http.get<any>(url, {headers: headers, withCredentials: true});
  }

  getUserMe(): Observable<User> {
    let url: string = this.defineBaseURL("users/me");
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    return this.http.get<User>(url, {headers: headers, withCredentials: true});
  }

  getUser(user_id: string): Observable<User> {
    let url: string = this.defineBaseURL("users/"+user_id);
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    return this.http.get<User>(url, {headers: headers, withCredentials: true});
  }

  deleteUser(user_id: string): Observable<string> {
    let url: string = this.defineBaseURL("users/"+user_id);
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    return this.http.delete<string>(url, {headers: headers, withCredentials: true});
  }

  addUser(user: User): Observable<User> {
    let url: string = this.defineBaseURL("auth/register");
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 
    
    return this.http.post<User>(url, user, {headers: headers, withCredentials: true});
  }

  updateUser(user: User): Observable<User> {
    let url: string = this.defineBaseURL("users/"+user.id);
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    return this.http.patch<any>(url, user, {headers: headers, withCredentials: true});
  }

  getUserPreferences() : Observable<any> {
    let url: string = this.defineBaseURL("users/preferences");
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    return this.http.get<any>(url, {headers: headers, withCredentials: true});
  }

  setUserPreferences(autoMoveOn: number): Observable<any> {
    let url: string = this.defineBaseURL("users/preferences");
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    var data: any = {}
    data["auto_move_on"] = autoMoveOn

    return this.http.put<any>(url, data, {headers: headers, withCredentials: true});
  }

}
