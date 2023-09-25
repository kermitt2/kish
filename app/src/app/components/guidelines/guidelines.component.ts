import { Component, OnInit, Input } from '@angular/core';
import { UserService } from '../../services/user.service';
import { ToastrService } from '../../services/toastr.service';
import { TaskdataService } from '../../services/taskdata.service';
import { GuidelinesService } from '../../services/guidelines.service';

import * as $ from 'jquery';

@Component({
  selector: 'app-guidelines',
  templateUrl: './guidelines.component.html',
  styleUrls: ['./guidelines.component.css']
})
export class GuidelinesComponent implements OnInit {
  taskIdentifier: string;

  constructor(private guidelinesService: GuidelinesService, 
              private taskdataService: TaskdataService, 
              private toastrService: ToastrService) { }

  ngOnInit(): void {
    const selectedTask = this.taskdataService.getTaskdata();
    if (selectedTask) {
      this.taskIdentifier = selectedTask["id"];
      this.showGuidelines();
    }
  }

  showGuidelines(): void {
    this.guidelinesService.getGuidelines(this.taskIdentifier)
        .subscribe(
          (data: any) =>  {  // success
            if (data["record"] && data["record"]["text"]) {
              const guidelineContent = data["record"]["text"];
              $("#guidelines-view").html(guidelineContent);
            } else {
              $("#guidelines-view").html("No guidelines available for this task :(");
            }
          }, 
          (error: any)   => this.toastrService.callToaster("toast-top-center", "error", error["message"], "Damn, accessing guidelines didn't work!"),
          ()             => { console.log('guidelines done'); } // completed
       );
  }
}
