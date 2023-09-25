import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpParams } from "@angular/common/http";
import { ApiBaseService } from '../../services/api-base.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent {

  email: string | null = null;
  password: string | null = null;
  forename: string | null = null;
  lastname: string | null = null;
  cpassword: string | null = null;

  // init terms agreement is true at startup by default
  termCheckbox: boolean = true;

  is_email_valid: boolean = false;
  is_email_invalid: boolean = false;
  is_password_valid: boolean = false;
  is_password_invalid: boolean = false;
  is_cpassword_valid: boolean = false;
  is_cpassword_invalid: boolean = false;
  is_termCheckbox_invalid: boolean = false;
  passwords_not_match:boolean = false

  submit_invalid: boolean = false;
  submit_message: string = "";

  empty_email:boolean = false;
  bad_email:boolean = false;
  empty_password:boolean = false;
  bad_password:boolean = false;
  empty_cpassword:boolean = false;
  bad_cpassword:boolean = false;

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

  signup(): void {
    // possible logout required?

    if (this.validate_signup(this.email, this.forename, this.lastname, this.password, this.cpassword, this.termCheckbox)) {
      // try to register the new user
      let url: string = this.defineBaseURL("auth/register");
      let data: any = {};
      data["email"] = this.email;
      data["email"] = this.email;
      data["password"] = this.password;
      if (this.forename != null && this.forename.length > 0)
          data["first_name"] = this.forename;
      if (this.lastname != null && this.lastname.length > 0)
          data["last_name"] = this.lastname;
      data["role"] = "annotator";

      const headers = { 'content-type': 'application/json; charset=UTF-8'}; 

      this.http.post<any>(url, data, {'headers':headers}).subscribe({
        next: data => {
          console.log("success");
        },
        error: error => {
          this.submit_invalid = true;
          this.submit_message = error.message;
        }
      });
    }
  }

  validate_signup(email: string | null, 
                  forename: string | null, 
                  lastname: string | null, 
                  password: string | null, 
                  cpassword: string | null, 
                  termCheckbox: boolean): boolean {
    let validation: boolean = true;

    this.empty_email = false;
    this.bad_email = false;
    this.empty_password = false;
    this.bad_password = false;
    this.empty_cpassword = false;
    this.bad_cpassword = false;
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

    this.is_termCheckbox_invalid = false;
    if (!termCheckbox) {
      this.is_termCheckbox_invalid = true;
      validation = false;
    }

    return validation;
  }


}
