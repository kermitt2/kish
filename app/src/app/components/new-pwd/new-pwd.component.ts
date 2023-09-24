import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpParams } from "@angular/common/http";

@Component({
  selector: 'app-new-pwd',
  templateUrl: './new-pwd.component.html',
  styleUrls: ['./new-pwd.component.css']
})
export class NewPwdComponent {

  password: string | null = null;
  cpassword: string | null = null;

  is_password_valid: boolean = false;
  is_password_invalid: boolean = false;
  is_cpassword_valid: boolean = false;
  is_cpassword_invalid: boolean = false;
  passwords_not_match:boolean = false

  submit_invalid: boolean = false;
  submit_valid: boolean = false;
  submit_message: string = "";

  empty_password:boolean = false;
  bad_password:boolean = false;
  empty_cpassword:boolean = false;
  bad_cpassword:boolean = false;

  constructor(private router: Router, private http: HttpClient) {}

  defineBaseURL(ext: string): string {
    let localBase: string = "http://0.0.0.0:8050";
    if (!localBase.endsWith("/")) {
        localBase = localBase + "/";
    }
    if (ext != null)
        localBase += ext;
    return localBase
  }

  newPwd(): void {
    // get token parameter
    const searchParams = new URLSearchParams(window.location.search);

    if (!searchParams.has('token')) {
      console.log("token is missing, password update is not possible")
      $('#div-submit').append("<div class=\"invalid-feedback\" style=\"color:red; display:inline;\">Password reset link invalid: token is missing, please check your email!</div>");
    } else {
      const token = searchParams.get('token')
      if (this.validate_new_pwd(this.password, this.cpassword)) {
        let url: string = this.defineBaseURL("auth/reset-password");

        let data: any = {};
        data["password"] = this.password;
        data["token"] = token;

        const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

        this.http.post<any>(url, data, {'headers':headers}).subscribe({
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
  }

  /*function newPassword() {
        // get token parameter
        const searchParams = new URLSearchParams(window.location.search);

        if (!searchParams.has('token')) {
            console.log("token is missing, password update is not possible")
            $('#div-submit').append("<div class=\"invalid-feedback\" style=\"color:red; display:inline;\">Password reset link invalid: token is missing, please check your email!</div>");
        } else {
            const token = searchParams.get('token')

            var password = $("#newPassword").val();
            password = password.trim();
            var cpassword = $("#conPassword").val();
            cpassword = cpassword.trim();

            if (validate_pwds(password, cpassword)) {
                var url = defineBaseURL("auth/reset-password");

                var data = {};
                data["password"] = password;
                data["token"] = token;

                var xhr = new XMLHttpRequest();
                xhr.open("POST", url, true);
                xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
                //xhr.setRequestHeader('Authorization', 'Bearer ' + token);

                xhr.onloadend = function () {
                    // status
                    if (xhr.status != 200 && xhr.status != 201 && xhr.status != 202) {
                        // display server level error
                        var response = JSON.parse(xhr.responseText);
                        console.log(response["detail"]);
                        $('#div-submit').append("<div class=\"invalid-feedback\" style=\"color:red; display:inline;\">New password rejected: <br/>"+
                            response["detail"]+"</div>");
                    } else {
                        $('#div-submit').append("<div class=\"valid-feedback\" style=\"color:green; display:inline;\">Your password is updated !<br/> &nbsp;</div>");
                        $('#div-submit').append("<div class=\"valid-feedback\" style=\"color:green; display:inline;\"><p>Go to: <a href=\"sign-in.html\">Sign-in</a></p></div>");
                    }
                };
                xhr.send(JSON.stringify(data));
            }
        }
    }*/

  validate_new_pwd(password: string | null, 
                   cpassword: string | null): boolean {
    let validation: boolean = true;

    this.empty_password = false;
    this.bad_password = false;
    this.empty_cpassword = false;
    this.bad_cpassword = false;
    this.submit_invalid = false;

    this.is_password_valid = false;
    this.is_password_invalid = false;
    if (password === null || password === "") {
        this.empty_password = true;
        this.is_password_invalid = true;
        validation = false;
    } else if (password.length < 8) {
        this.bad_password = true;
        this.is_password_invalid = true;
        validation = false;
    } else {
        this.is_password_valid = true;
    }

    this.is_cpassword_valid = false;
    this.is_cpassword_invalid = false;
    this.passwords_not_match = false
    if (cpassword === null || cpassword === "") {
        this.empty_cpassword = true;
        this.is_cpassword_invalid = true;
        validation = false;
    } else if (cpassword.length < 8) {
        this.bad_cpassword = true;
        this.is_cpassword_invalid = true;
        validation = false;
    } else if (password !== null && password.length >= 8 && password !== cpassword) {
      this.is_password_invalid = true;
      this.is_cpassword_invalid = true;
      this.passwords_not_match = true;
      validation = false;
    } 
    else {
      this.is_cpassword_valid = true;
    }

    return validation;
  }



}
