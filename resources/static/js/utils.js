/**
 * Conversion of string to HTML entities
 */
String.prototype.toHtmlEntities = function() {
    return this.replace(/./gm, function(s) {
        // return "&#" + s.charCodeAt(0) + ";";
        return (s.match(/[a-z0-9\s]+/i)) ? s : "&#" + s.charCodeAt(0) + ";";
    });
};

/**
 * Creation of string from HTML entities
 */
String.fromHtmlEntities = function(string) {
    return (string+"").replace(/&#\d+;/gm,function(s) {
        return String.fromCharCode(s.match(/\d+/gm)[0]);
    })
};

function defineBaseURL(ext) {
    var baseUrl = null;
    var localBase = $(location).attr('href');
    if ( localBase.indexOf("/index.html") != -1) {
         localBase = localBase.replace("/index.html", "");
    } 
    if ( localBase.indexOf("app") != -1) {
         localBase = localBase.replace("app", "");
    } 
    if (localBase.endsWith("#")) {
        localBase = localBase.substring(0,localBase.length-1);
    }
    if (!localBase.endsWith("/")) {
        localBase = localBase + "/";
    }
    if (ext != null)
        localBase += ext;

    return localBase
}

/**
 * Message toaster with default duration 5 seconds
 */
function callToaster(positionClass, type, msg, greetings) {
    callToaster(positionClass, type, msg, greetings, "5000");
}

function callToaster(positionClass, type, msg, greetings, duration) {
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

function storeAnnotation(taskInfo, excerptIdentifier, label_id, value) {
    var url = defineBaseURL("annotations/annotation");
    var data = {};
    data["label_id"] = label_id;
    data["value"] = value;
    data["excerpt_id"] = excerptIdentifier;
    data["task_id"] = taskInfo["id"];
    data["score"] = 1.0;
    data["source"] = "manual";
    const timeElapsed = Date.now();
    const date = new Date(timeElapsed);
    data["date"] = date.toISOString()
    if (taskInfo["type"] === "reconciliation") {
        data["type"] = taskInfo["subtype"];
        data["curated"] = 1;
    } else {
        data["type"] = taskInfo["type"];
        data["curated"] = 0;
    }
    data["ignored"] = 0;

    // retrieve the existing task information
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onloadend = function () {
        if (xhr.status == 401) {
            window.location.href = "sign-in.html";
        } else if (xhr.status != 200) {
            // display server level error
            var response = JSON.parse(xhr.responseText);
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, adding annotation didn't work!");
        } else {
            // successfully store new annotation, nothing to worry here
        }
    }

    xhr.send(JSON.stringify(data));
}

function ignoreExcerpt(userInfo, taskInfo, labels, otherLabels, rank, excerptIdentifier) {
    var url = defineBaseURL("annotations/annotation");
    var data = {}
    data["excerpt_id"] = excerptIdentifier;
    data["task_id"] = taskInfo["id"];
    data["source"] = "manual";
    const timeElapsed = Date.now();
    const date = new Date(timeElapsed);
    data["date"] = date.toISOString()
    data["type"] = taskInfo["type"];
    data["ignored"] = 1;

    var xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onloadend = function () {
        if (xhr.status == 401) { 
            window.location.href = "sign-in.html";
        } else if (xhr.status != 200) {
            // display server level error
            var response = JSON.parse(xhr.responseText);
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, ignoring excerpt didn't work!");
        } else {
            // update progress info display
            var currentcountStr = $("#progress-done").text();
            var currentCount = parseInt(currentcountStr);
            if (currentCount != NaN) {
                currentCount += 1;
                if (currentCount == taskInfo["nb_excerpts"]) {
                    $("#progress-done").html(currentCount);
                    $("#progress-complete").html("<span style=\"color: green;\">Completed !</span>");
                } else if (currentCount < taskInfo["nb_excerpts"]) {
                    $("#progress-done").html(currentCount);
                }
            }

            // update button
            $("#button-validate").css("background-color", "#8a909d");
            $("#button-validate").html("Update");
            $("#button-validate").css("color", "white");

            $("#button-ignore").css("background-color", "red");
            $("#button-ignore").html("Ignored");
            $("#button-ignore").css("color", "black");

            $("#button-validate").off('click');
            $("#button-ignore").off('click');
            $("#button-validate").click(function() {
                validateAnnotation(userInfo, taskInfo, labels, otherLabels, rank, excerptIdentifier, true);
                return true;
            });
        }
    }

    xhr.send(JSON.stringify(data));
}

function updateTaskAssignment(taskIdentifier, completed, currentCount) {
    var url = defineBaseURL("tasks/"+taskIdentifier+"/assign");
    var data = {}
    data["in_progress"] = 1;
    data["is_completed"] = completed;
    data["completed_excerpts"] = currentCount

    var xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onloadend = function () {
        if (xhr.status == 401) { 
            window.location.href = "sign-in.html";
        } else if (xhr.status != 200) {
            // display server level error
            var response = JSON.parse(xhr.responseText);
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, updating task assigment progress didn't work!");
        } else {
            if (data["is_completed"]) {
                checkReconciliation(taskIdentifier);
            }
        }
    }
    xhr.send(JSON.stringify(data));
}

function checkReconciliation(taskIdentifier) {
    var url = defineBaseURL("tasks/"+taskIdentifier+"/reconciliation");

    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    xhr.onloadend = function () {
        if (xhr.status == 401) { 
            window.location.href = "sign-in.html";
        } else if (xhr.status != 200) {
            // display server level error
            var response = JSON.parse(xhr.responseText);
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, updating task assigment completeness didn't work!");
        } 
    }

    xhr.send(null);
} 

function setDocumentInfo(documentIdentifier) {
    var url = defineBaseURL("documents/"+documentIdentifier);

    // retrieve the existing task information
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onloadend = function () {
        // status
        var response = JSON.parse(xhr.responseText);
        if (xhr.status != 200) {
            // display server level error
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, accessing document record didn't work!");
            $("#doc_url").html("<p>The document record is not available</p>");
        } else {
            response = response["record"];
            docText = ""
            if (response["pdf_uri"]) {
                docText += "<a href=\""+response["pdf_uri"]+"\" target=\"_blank\">full text</a> ";
            } 
            if (response["doi"])
                docText += " - " + response["doi"];
            $("#doc_url").html(docText);
        }
    }
    xhr.send(null);
}

function validateAnnotation(userInfo, taskInfo, labels, otherLabels, rank, excerptIdentifier, update) {
    // grab class values in a map
    var classValueMap = {};
    for (var labelPos in labels) {
        var label = labels[labelPos];

        if ($("#checkbox-"+label["name"]).is(":checked")) {
            classValueMap[label["id"]] = 1;
        } else {
            classValueMap[label["id"]] = 0;
        }
    }

    // store annotation
    for(var key in classValueMap) {
        storeAnnotation(taskInfo, excerptIdentifier, key, classValueMap[key]);
    }

    // update progress info display
    var completed = 0;
    var currentcountStr = $("#progress-done").text();
    var currentCount = parseInt(currentcountStr);
    if (!update) {
        if (currentCount != NaN) {
            currentCount += 1;
            if (currentCount >= taskInfo["nb_excerpts"]) {
                $("#progress-done").html(currentCount);
                $("#progress-complete").html("<span style=\"color: green;\">Completed !</span>");
                completed = 1;
                currentCount = taskInfo["nb_excerpts"];
            } else if (currentCount < taskInfo["nb_excerpts"]) {
                $("#progress-done").html(currentCount);
            }
        }
    } else {
        if (currentCount >= taskInfo["nb_excerpts"]) {
            completed = 1;
            currentCount = taskInfo["nb_excerpts"];
            callToaster("toast-top-center", "success", "the annotation excerpt is updated", "Yes!", "1000");
        }
    }

    // update button
    $("#button-validate").css("background-color", "#fec400");
    $("#button-validate").html("Update");
    $("#button-validate").css("color", "black");

    $("#button-ignore").css("background-color", "#8a909d");
    $("#button-ignore").html("Ignore");
    $("#button-ignore").css("color", "white");
    
    $("#button-validate").off('click');
    $("#button-validate").click(function() {
        validateAnnotation(userInfo, taskInfo, labels, otherLabels, rank, excerptIdentifier, true);
        return true;
    });
    $("#button-ignore").off('click');
    $("#button-ignore").click(function() {
        ignoreExcerpt(userInfo, taskInfo, labels, otherLabels, rank, excerptIdentifier);
        return true;
    });

    // if auto move on is set, we move automatically to the next excerpt item of the task, except if we are at the end
    if (userInfo["auto_move_on"] == 1 && completed == 0 && ((rank+1) != taskInfo["nb_excerpts"])) {
        setExcerptView(userInfo, taskInfo, labels, otherLabels, rank+1);
    }

    // update task assignment information to keep track of the progress more easily
    updateTaskAssignment(taskInfo["id"], completed, currentCount);
}
