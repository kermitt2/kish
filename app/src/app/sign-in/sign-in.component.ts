import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpParams } from "@angular/common/http";

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent {

  email: string | null = null;
  password: string | null = null;

  is_email_valid: boolean = false;
  is_email_invalid: boolean = false;
  is_password_valid: boolean = false;
  is_password_invalid: boolean = false;

  submit_invalid: boolean = false;
  submit_message: string = "";

  empty_email:boolean = false;
  bad_email:boolean = false;
  empty_password:boolean = false;
  bad_password:boolean = false;

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

  signin(): void {
    if (this.validate_signin(this.email, this.password)) {
      // try to login the user
      let url: string = this.defineBaseURL("auth/jwt/login");

      const headers = { 'content-type': 'application/x-www-form-urlencoded', 'accept': 'application/json'}; 
      let params: any = { "username": this.email, "password": this.password };

      let urlEncodedData = "";
      for(let name in params) {
        urlEncodedData += encodeURIComponent(name)+'='+encodeURIComponent(params[name])+"&"; 
      }
      urlEncodedData = urlEncodedData.slice(0, -1);

      this.http.post<any>(url, urlEncodedData, {'headers':headers}).subscribe({
        next: data => {
          console.log("success");
        },
        error: error => {
          this.submit_invalid = true;
          this.submit_message = error.message;
        }
      })
    }
  }

  validate_signin(email: string | null, password: string | null): boolean {
    let validation: boolean = true;

    this.empty_email = false;
    this.bad_email = false;
    this.empty_password = false;
    this.bad_password = false;
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

    return validation;
  }


}
