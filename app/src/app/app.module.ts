import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { ResetPwdComponent } from './components/reset-pwd/reset-pwd.component';
import { NewPwdComponent } from './components/new-pwd/new-pwd.component';
import { MainComponent } from './components/main/main.component';
import { UsersComponent } from './components/users/users.component';

import { UserService } from './services/user.service'
import { ToastrService } from './services/toastr.service'

// managing 401
import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { HttpRequest, HttpClient, HttpHandler, HttpEvent, HttpErrorResponse, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TasksComponent } from './components/tasks/tasks.component';
import { DatasetsComponent } from './components/datasets/datasets.component';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private router: Router) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        //console.log('intercepted');
        return next.handle(req).pipe(
          catchError(err => this.handleError(err)));
    }
    
    private handleError(err: HttpErrorResponse): Observable<any> {
        //console.log('caught');
        if (err.status === 401 || err.status === 403) {
            this.router.navigateByUrl("/sign-in");
            return of(err.message);
        }
        // handle the error 
        return throwError(err);
    }
}

@NgModule({
  declarations: [
    AppComponent,
    SignInComponent,
    SignUpComponent,
    ResetPwdComponent,
    NewPwdComponent,
    MainComponent,
    UsersComponent,
    TasksComponent,
    DatasetsComponent
  ],
  imports: [
    NgbModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    UserService, 
    ToastrService, 
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})

export class AppModule {}
