import { Injectable } from '@angular/core';
import { User } from '../interfaces/user';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import * as $ from 'jquery';

@Injectable({
  providedIn: 'root'
})
export class UserService {

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

  getUsers(): Observable<any> {
    let url: string = this.defineBaseURL("users");
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    return this.http.get<any>(url, {headers: headers, withCredentials: true});

    /*.subscribe(
      response => {
        console.log("status", response.status);
        console.log(response);
        if (response.status == 200 || response.status == 201) {
          let users: User[] = response.body;
        } else if (response.status == 401) {
          this.router.navigateByUrl('/sign-in')
        } else {
          //var response = JSON.parse(xhr.responseText);
          console.log(response["detail"]);
          //callToaster("toast-top-center", "error", response["detail"], "Damn, accessing users didn't work!");
          //$("#user-view-table").html("<tr><td>No Users available</td></tr>");
        }
      });*/
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
