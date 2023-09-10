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
  show_users_home: boolean = false

  constructor(private router: Router, private http: HttpClient, private userService: UserService, private toastrService: ToastrService) {}

  ngOnInit() {
    //clearMainContent();
    this.setAuthenticatedUserInfo();
    this.toastrService.callToaster("toast-top-center", "success", "Welcome to KISH", "Yo!");
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

  /*setAuthenticatedUserInfoOld(): void {
    let url: string = this.defineBaseURL("users/me");
    //let headers = new Headers();
    //headers.append('Content-Type', 'application/json; charset=UTF-8');

    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    //let options = new RequestOptions({ headers: headers, observe: 'response', withCredentials: true });

    this.http.get<User>(url, {headers: headers, observe: 'response', withCredentials: true}).subscribe(
      response => {
        console.log("status", response.status);
        console.log(response);
        if (response.status == 200 || response.status == 201) {
          let data: User = response.body;
          this.userInfo = data;
          console.log(this.userInfo);
          //this.updateUserSettings(userInfo);
          if (this.userInfo["role"] == "admin") {
              this.show_users_home = true;
          }
          //initTaskState();
        } else {
          this.router.navigateByUrl('/sign-in')
        }
      });
  }*/



  /*function activateMenuChoice(element) {
    $("#tasks-home").find('span').css("color", "");
    $("#tasks-home").removeClass("active");
    $("#users-home").find('span').css("color", "");
    $("#users-home").removeClass("active");
    $("#datasets-home").find('span').css("color", "");
    $("#datasets-home").removeClass("active");
    $("#user-menu-home").find('span').css("color", "");
    $("#user-menu-home").removeClass("active");
    element.find('span').css("color", "#7DBCFF");
    element.addClass("active");
  }*/

}
