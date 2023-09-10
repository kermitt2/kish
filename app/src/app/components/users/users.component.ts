import { Component, OnInit } from '@angular/core';
import { User } from '../../interfaces/user';
import { UserService } from '../../services/user.service';
import { ToastrService } from '../../services/toastr.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  
  userIds: string[];
  users: Array<User>;
  viewAddUserRow: boolean = false;
  editedFieldId: string;

  constructor(private UserService: UserService, private toastrService: ToastrService) { }

  ngOnInit(): void {
    this.setUsers();
  }

  setUsers(): void {
    this.UserService.getUsers()
        .subscribe(
          (data: any) =>  {  // success
            this.userIds = data["records"];
            this.users = new Array<User>(this.userIds.length);
            for (let i=0; i< this.userIds.length; i++) {
              this.setUser(this.userIds[i], i);
            }
            
          }, 
          (error: any)   => console.log(error), // error
          ()             => { console.log('all user id get'); } // completed
       );
  }

  setUser(user_id: string, index: number): void {
    this.UserService.getUser(user_id)
        .subscribe(
          (data: User) =>  {  // success
            this.users[index] = data;
          }, 
          (error: any)   => console.log(error), // error
          ()             => console.log('user id get') // completed
       );
  }

  editField(field: string, position: string, pos: number): void {
    if (this.editedFieldId != null && position === this.editedFieldId) {
      // already edited. nothing to do
      return;
    }

    $("#"+position + " > span").css("display", "none");
    $("#"+position + " > input").css("display", "");
    $("#"+position + " > input").focus();

    if (this.editedFieldId) {
      $("#"+this.editedFieldId + " > span").css("display", "");
      $("#"+this.editedFieldId + " > input").css("display", "none");
    }

    this.editedFieldId = position;

    $("#update-user-"+pos).css("color", "orange");
    $("#update-user-"+pos).addClass("active");
    $("#password-user-"+pos).off('click');
  }

  leaveField(position: string, pos: number): void {
    console.log("leaveField");

    if (this.editedFieldId == null || position !== this.editedFieldId) {
      // not edited, nothing to do
      return;
    }
    $("#"+position + " > span").css("display", "");
    $("#"+position + " > input").css("display", "none");

    this.editedFieldId = "";
    $("#update-user-"+pos).css("color", "grey");
    $("#update-user-"+pos).addClass("active");
    $("#password-user-"+pos).off('click');
  }

  viewAddUser(): void {
    this.viewAddUserRow = true; 
    $("#update-new-user").css("color", "orange");
    $("#update-new-user").addClass("active");
    $("#new-user-input-password").off('click');
  }

  deleteUser(user_id: string): void {
    this.UserService.deleteUser(user_id)
        .subscribe(
          (data: any) =>  {  // success
            let indexDeleted: number = this.userIds.indexOf(user_id);
            if (indexDeleted != -1) {
              this.userIds.splice(indexDeleted, 1);
              this.users.splice(indexDeleted, 1);
            }
            this.toastrService.callToaster("toast-top-center", "success", "", "User has been deleted!")
          }, 
          (error: any)   => this.toastrService.callToaster("toast-top-center", "error", error["message"], "Damn, deleting user didn't work!"),
          ()             => console.log('user deleted') // completed
       );
  }

  addUser(): void {
    let localUser = {} as User;
    // fill user properties (we should use ngModel, but let's use shortcut)
    let user_pos: number = this.userIds.length;
    localUser = this.fillUser(localUser, user_pos);
    
    this.UserService.addUser(localUser)
        .subscribe(
          (data: User) =>  {  // success
            this.userIds.push(data.id);
            this.users.push(data);
            this.viewAddUserRow = false;
            this.toastrService.callToaster("toast-top-center", "success", "", "New user has been added!")
          }, 
          (error: any)   => this.toastrService.callToaster("toast-top-center", "error", error["message"], "Damn, adding the new user didn't work!"),
          ()             => console.log('user added') // completed
       );
  }

  updateUser(user_pos: number): void {
    let localUser: User = this.users[user_pos];
    // fill user properties (we should use ngModel, but let's use shortcut)
    localUser = this.fillUser(localUser, user_pos);

    console.log(localUser)
    //delete localUser["email"];

    this.UserService.updateUser(localUser)
        .subscribe(
          (data: User) =>  {  // success
            this.userIds[user_pos] = data.id;
            this.users[user_pos] = data;
            this.toastrService.callToaster("toast-top-center", "success", "", "User has been updated!")
          }, 
          (error: any)   => this.toastrService.callToaster("toast-top-center", "error", error["message"], "Damn, updating the user didn't work!"),
          ()             => console.log('user added') // completed
       );
  }

  /** shortcut reused method from old jquery to fill the user object from the template fields */
  fillUser(localUser: User, pos: number): User {
    //email
    const email: string =$("#email-user-"+pos).val() as string;

    // role 
    const role: string = $("#role-"+pos+" option:selected").val() as string;

    // first name 
    const firstName: string = $("#first-name-input-"+pos).val() as string;

    // first name 
    const lastName: string = $("#last-name-input-"+pos).val() as string;

    // password 
    const password: string = $("#password-input-"+pos).val() as string;

    localUser["role"] = role;
    if (email && email.length > 0)
        localUser["email"] = email;
    if (firstName && firstName.length > 0)
        localUser["first_name"] = firstName;
    if (lastName && lastName.length > 0)
        localUser["last_name"] = lastName;
    if (password && password.length > 0)
        localUser["password"] = password;

    return localUser;
  }


}
