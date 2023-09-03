import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpParams } from "@angular/common/http";

import * as $ from 'jquery';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {

  userInfo: any = {}

  selectedMenuChoice: string = "tasks-home";

  // component/panel visibility
  show_users_home: boolean = false

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    //clearMainContent();
    this.setAuthenticatedUserInfo();
    //callToaster("toast-top-center", "success", "Welcome to KISH", "Yo!");
  }

  defineBaseURL(ext: string): string {
    let localBase: string = "http://0.0.0.0:8050";
    if (!localBase.endsWith("/")) {
        localBase = localBase + "/";
    }
    if (ext != null)
        localBase += ext;
    return localBase
  }

  setAuthenticatedUserInfo(): void {
    let url: string = this.defineBaseURL("users/me");
    const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

    this.http.get<any>(url, {observe: 'response', withCredentials: true}).subscribe(
      response => {
        console.log("status", response.status);
        console.log(response);
        if (response.status == 200 || response.status == 201) {
          let data: any = response.body
          this.userInfo = data;
          //this.updateUserSettings(userInfo);
          if (this.userInfo["role"] == "admin") {
              this.show_users_home = true;
          }
          //initTaskState();
        } else {
          this.router.navigateByUrl('/sign-in')
        }
      });
  }



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
