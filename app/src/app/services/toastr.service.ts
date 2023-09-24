import { Injectable } from '@angular/core';

declare let toastr: any;

@Injectable({
  providedIn: 'root'
})
export class ToastrService {

  constructor() { }

  /**
   * Message toaster with default duration 5 seconds
   */
  callToaster(positionClass: string, type: string, msg: string, greetings: string, duration: string = "5000"): void {
      if (document.getElementById("toaster")) {
          toastr.options = {
              closeButton: true,
              debug: false,
              newestOnTop: false,
              progressBar: true,
              positionClass: positionClass,
              preventDuplicates: false,
              onclick: null,
              showDuration: "300",
              hideDuration: "1000",
              timeOut: duration,
              extendedTimeOut: "1000",
              showEasing: "swing",
              hideEasing: "linear",
              showMethod: "fadeIn",
              hideMethod: "fadeOut"
          };
          if (type==="success")
              toastr.success(msg, greetings);
          else if (type==="error")
              toastr.error(msg, greetings);
      }
  }

}
