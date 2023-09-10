import { Component, OnInit } from '@angular/core';
import { User } from '../../interfaces/user';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  
  userIds: string[];
  users: Array<User>;

  constructor(private UserService: UserService) { }

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

}
