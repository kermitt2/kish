import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './components/main/main.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { ResetPwdComponent } from './components/reset-pwd/reset-pwd.component';
import { NewPwdComponent } from './components/new-pwd/new-pwd.component';
import { UsersComponent } from './components/users/users.component';

const routes: Routes = [
    { path: "", component: MainComponent },
    { path: "main", component: MainComponent },
    { path: "sign-in", component: SignInComponent },
    { path: "sign-up", component: SignUpComponent },
    { path: "reset-pwd", component: ResetPwdComponent },
    { path: "new-pwd", component: NewPwdComponent }
  ];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
