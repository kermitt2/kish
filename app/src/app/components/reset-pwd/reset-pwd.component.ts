import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpParams } from "@angular/common/http";
import { ApiBaseService } from '../../services/api-base.service';

@Component({
  selector: 'app-reset-pwd',
  templateUrl: './reset-pwd.component.html',
  styleUrls: ['./reset-pwd.component.css']
})
export class ResetPwdComponent {

  email: string | null = null;

  is_email_valid: boolean = false;
  is_email_invalid: boolean = false;

  empty_email:boolean = false;
  bad_email:boolean = false;

  submit_invalid: boolean = false;
  submit_message: string = "";

  submit_valid: boolean = false;

  constructor(private router: Router, private http: HttpClient, private apiBaseService: ApiBaseService) {}

  defineBaseURL(ext: string): string {
    let localBase: string = this.apiBaseService.getApiBase();
    if (!localBase.endsWith("/")) {
        localBase = localBase + "/";
    }
    if (ext != null)
        localBase += ext;
    return localBase
  }

  resetPwd(): void {
    if (this.validate_resetPws(this.email)) {
      // try to login the user
      let url: string = this.defineBaseURL("auth/forgot-password");

      const headers = { 'content-type': 'application/json; charset=UTF-8'}; 
      let params: any = { "email": this.email };

      /*let urlEncodedData = "";
      for(let name in params) {
        urlEncodedData += encodeURIComponent(name)+'='+encodeURIComponent(params[name])+"&"; 
      }
      urlEncodedData = urlEncodedData.slice(0, -1);*/

      this.http.post<any>(url, params, {'headers':headers, withCredentials: true}).subscribe({
        next: data => {
          console.log("success");
          this.submit_valid = true;
        },
        error: error => {
          this.submit_invalid = true;
          this.submit_message = error.message;
        }
      });

    }
  }

  /*function forgotPassword() {
        var email = $("#email").val();
        console.log(email);

        if (validate_email(email)) {
            var url = defineBaseURL("auth/forgot-password");

            var data = {};
            data["email"] = email;

            var xhr = new XMLHttpRequest();
            xhr.open("POST", url, true); 
            xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

            xhr.onloadend = function () {
                // status
                if (xhr.status != 200 && xhr.status != 201 && xhr.status != 202) {
                    // display server level error
                    var response = JSON.parse(xhr.responseText);
                    console.log(response["detail"]);
                    $('#div-submit').append("<div class=\"invalid-feedback\" style=\"color:red; display:inline;\">Error user email: <br/>"+
                        response["detail"]+"</div>");
                } else {
                    $('#div-submit').append("<div class=\"valid-feedback\" style=\"color:green; display:inline;\">Password reset: Check your email !<br/> &nbsp;</div>");
                }
            };
            xhr.send(JSON.stringify(data));
        }
    }*/

  validate_resetPws(email: string | null): boolean {
    let validation: boolean = true;

    this.empty_email = false;
    this.bad_email = false;
    this.submit_invalid = false;

    this.is_email_valid = false;
    this.is_email_invalid = false;
    if (email === null || email == "") {
        this.empty_email = true;
        this.is_email_invalid = true;
        validation = false;
    } else if (email.indexOf("@") == -1) {
        this.bad_email = true;
        this.is_email_invalid = true;
        validation = false;
    } else {
        this.is_email_valid = true;
    }

    return validation;
  }


}
