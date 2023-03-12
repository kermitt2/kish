/**
 * functions for managing guidelines
 **/

var showGuidelines = function(taskIdentifier) {
    event.preventDefault();
    var url = defineBaseURL("tasks/"+taskIdentifier+"/guidelines");

    // retrieve the existing task information
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onloadend = function () {
        // status
        if (xhr.status != 200) {
            // display server level error
            var response = JSON.parse(xhr.responseText);
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, accessing guidelines didn't work!");
        } else {
            var response = JSON.parse(xhr.responseText);
            if (response["record"] && response["record"]["text"]) {
                var guidelineContent = response["record"]["text"];
                $("#guidelines-view").html(guidelineContent);   
            } else {
                $("#guidelines-view").html("No guidelines available for this task :(");
            }
        }
    };

    // send the collected data as JSON
    xhr.send(null);
};
