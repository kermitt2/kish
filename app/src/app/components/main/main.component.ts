import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpParams } from "@angular/common/http";
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../services/user.service';
import { ToastrService } from '../../services/toastr.service';
import { User } from '../../interfaces/user';

import * as $ from 'jquery';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  userInfo: User = {} as User;

  selectedMenuChoice: string = "tasks-home";

  // component/panel visibility
  show_users_home: boolean = false;

  // move on preference selection 
  moveOnPreference: number = 1;

  constructor(private router: Router, private http: HttpClient, private userService: UserService, private toastrService: ToastrService) {}

  ngOnInit() {
    //clearMainContent();
    this.setAuthenticatedUserInfo();
    this.toastrService.callToaster("toast-top-center", "success", "Welcome to KISH", "Yo!");
    this.initPreferences();
  }

  defineBaseURL(ext: string): string {
    let localBase: string = "http://0.0.0.0:8050";
    if (!localBase.endsWith("/")) {
        localBase = localBase + "/";
    }
    if (ext != null)
        localBase += ext;
    return localBase;
  }

  setAuthenticatedUserInfo(): void {
     this.userService.getUserMe()
       .subscribe(
          (data: User) =>  { 
            this.userInfo = data;
            if (this.userInfo["role"] == "admin") {
              this.show_users_home = true;
            }
         }, 
         (error: any)   => console.log(error), 
         ()             => console.log('user me ok') 
       );
  }

  logout(): void {
    let url: string = this.defineBaseURL("auth/jwt/logout");
    const headers = { 'content-type': 'application/json; charset=UTF-8'};
    this.http.post<any>(url, null, {'headers':headers, withCredentials: true}).subscribe({
      next: data => {
        console.log("logout success");
        this.router.navigateByUrl('/sign-in')
      },
      error: error => {
        console.log(error.message);
      }
    });
  }

  initPreferences(): void {
    this.userService.getUserPreferences()
        .subscribe(
          (data: any) =>  {  
            this.moveOnPreference = data["record"]["auto_move_on"]
          }, 
          (error: any)   => this.toastrService.callToaster("toast-top-center", "error", error["message"], "Damn, getting your saved preferences didn't work!"),
          ()             => console.log('preferences updates') // completed
       );
    
  }

  submitPreferences(): void {
    this.userService.setUserPreferences(this.moveOnPreference)
        .subscribe(
          (data: any) =>  {  // success
            this.toastrService.callToaster("toast-top-center", "success", "", "Your preferences have been updated!")
          }, 
          (error: any)   => this.toastrService.callToaster("toast-top-center", "error", error["message"], "Damn, updating your preferences didn't work!"),
          ()             => console.log('preferences updates') // completed
       );
  }

}
