import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';

import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { UserService } from './services/user.service'
import { ToastrService } from './services/toastr.service'
import { TaskdataService } from './services/taskdata.service'

// managing 401
import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { HttpRequest, HttpClient, HttpHandler, HttpEvent, HttpErrorResponse, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AppComponent } from './app.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { ResetPwdComponent } from './components/reset-pwd/reset-pwd.component';
import { NewPwdComponent } from './components/new-pwd/new-pwd.component';
import { MainComponent } from './components/main/main.component';
import { UsersComponent } from './components/users/users.component';
import { TasksComponent } from './components/tasks/tasks.component';
import { DatasetsComponent } from './components/datasets/datasets.component';
import { UserMetricsComponent } from './components/user-metrics/user-metrics.component';
import { DatasetMetricsComponent } from './components/dataset-metrics/dataset-metrics.component';
import { DatasetCreationComponent } from './components/dataset-creation/dataset-creation.component';
import { DatasetExportComponent } from './components/dataset-export/dataset-export.component';
import { DocumentAnnotationComponent } from './components/document-annotation/document-annotation.component';
import { ExcerptAnnotationComponent } from './components/excerpt-annotation/excerpt-annotation.component';
import { ExcerptClassificationComponent } from './components/excerpt-classification/excerpt-classification.component';
import { GuidelinesComponent } from './components/guidelines/guidelines.component';

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
    DatasetsComponent,
    UserMetricsComponent,
    DatasetMetricsComponent,
    DatasetCreationComponent,
    DatasetExportComponent,
    DocumentAnnotationComponent,
    ExcerptAnnotationComponent,
    ExcerptClassificationComponent,
    GuidelinesComponent
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
    TaskdataService, 
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})

export class AppModule {}
