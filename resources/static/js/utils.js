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

function storeAnnotation(taskInfo, excerptIdentifier, label_id, value, offsets, callback) {
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
    if (offsets && offsets.length == 2) {
        data["offset_start"] = offsets[0];
        data["offset_end"] = offsets[1];
        data["chunk"] = value;
    }

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
            // successfully store new annotation, nothing to worry here, but we can execute a callback
            if (callback)
                callback();
        }
    }

    xhr.send(JSON.stringify(data));
}

function ignoreExcerpt(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptIdentifier) {
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

            // update excerpt status as ignored on server for this task
            updateExcerptTaskStatus(taskInfo["id"], excerptIdentifier, false, true);

            // update button
            //$("#button-validate").css("background-color", "#8a909d");
            //$("#button-validate").html("Update");
            //$("#button-validate").css("color", "white");
            $("#button-validate").removeClass("validate")
            $("#button-validate").addClass("update-inactive")

            //$("#button-ignore").css("background-color", "red");
            //$("#button-ignore").html("Ignored");
            //$("#button-ignore").css("color", "black");
            $("#button-ignore").removeClass("ignore")
            $("#button-ignore").addClass("ignored")

            $("#button-validate").off('click');
            $("#button-ignore").off('click');
            $("#button-validate").click(function() {
                validateAnnotation(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptIdentifier, true, recognito);
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

function validateAnnotation(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptIdentifier, update, recognito) {
    var classValueMap = {};
    var offsetValueMap = {};
    if (recognito) {
        // if labeling annotation, we grab annotations from the annotation layer
        const annotations = recognito.getAnnotations();
        for (var annotationPos in annotations) {
            const annotation = annotations[annotationPos];

            //console.log(annotation);

            /* recogito data model for inline annotations is as follow:
            {
              "@context": "http://www.w3.org/ns/anno.jsonld",
              "type": "Annotation",
              "body": [
                {
                  "type": "TextualBody",
                  "purpose": "tagging",
                  "value": "url"
                }
              ],
              "target": {
                "selector": [
                  {
                    "type": "TextQuoteSelector",
                    "exact": "http://brainsuite. usc.edu"
                  },
                  {
                    "type": "TextPositionSelector",
                    "start": 139,
                    "end": 165
                  }
                ]
              },
              "id": "#3abf3e45-e004-4594-921b-e4bec93c7f74"
            }
            */

            // keep only "tagging purpose"
            if (!annotation["body"][0]["purpose"] || annotation["body"][0]["purpose"] !== "tagging") {
                // not a tagging annotation, we can move on
                continue;
            }

            const labelName = annotation["body"][0]["value"];
            const labelId = getLabelId(labels, labelName, "labeling");
            if (!labelId) {
                // label is not found, something not valid
                console.log("no label id annotation found: " + labelName);
                continue;
            }

            if (!annotation["target"] || !annotation["target"]["selector"]) {
                // this annotation is incomple
                console.log("no selector found");
                continue;
            }

            for (var selectorPos in annotation["target"]["selector"]) {
                const selector = annotation["target"]["selector"][selectorPos];
                if (selector["type"] && selector["type"] === "TextQuoteSelector") {
                    classValueMap[labelId] = selector["exact"];
                } else if (selector["type"] && selector["type"] === "TextPositionSelector") {
                    const offsetStart = selector["start"];
                    const offsetEnd = selector["end"];
                    offsetValueMap[labelId] = [offsetStart, offsetEnd];
                }
            }            
        }
    } else {
        // if classification grab class values in a map
        for (var labelPos in labels) {
            var label = labels[labelPos];

            if ($("#checkbox-"+label["name"]).is(":checked")) {
                classValueMap[label["id"]] = 1;
            } else {
                classValueMap[label["id"]] = 0;
            }

            offsetValueMap[label["id"]] = [];
        }
    }

    // first clear existing annotation
    var url = defineBaseURL("tasks/" + taskInfo["id"] + "/excerpt/annotations");
    var data = {}
    data["excerpt_id"] = excerptIdentifier;
    data["task_id"] = taskInfo["id"];
    data["type"] = taskInfo["type"];

    var xhr = new XMLHttpRequest();
    xhr.open("DELETE", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onloadend = function () {
        if (xhr.status == 401) { 
            window.location.href = "sign-in.html";
        } else if (xhr.status != 200) {
            // display server level error
            var response = JSON.parse(xhr.responseText);
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, saving annotations didn't work!");
        } else {
            // older annotations, if any, are cleaned for the new ones

            // store annotations
            for(var key in classValueMap) {
                //console.log("store annotation:");
                //console.log(key + " / " + classValueMap[key] + " / " + offsetValueMap[key]);
                if (taskInfo["level"] && taskInfo["level"] === "document") {
                    storeAnnotation(taskInfo, excerptIdentifier, key, classValueMap[key], offsetValueMap[key], function() {
                        $("#sentence-"+excerptIdentifier+"-0").trigger("click");
                    });
                    
                } else {
                    storeAnnotation(taskInfo, excerptIdentifier, key, classValueMap[key], offsetValueMap[key], null);
                }
            }
            
            if (taskInfo["level"] && taskInfo["level"] === "document") 
                callToaster("toast-top-center", "success", "the annotation excerpt is updated", "Yes!", "1000");

            var completed = 0;
            // update header progress info display, for excerpt-level annotation task
            if (taskInfo["level"] !== "document") {
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
                    }
                    callToaster("toast-top-center", "success", "the annotation excerpt is updated", "Yes!", "1000");
                }
            } else {
                var currentcountStr = $("#progress-done").text();
                var currentCount = parseInt(currentcountStr);
                if (currentCount == taskInfo["nb_documents"]) {
                    completed = 1;
                }
            }

            // update excerpt status as validated on server for this task
            updateExcerptTaskStatus(taskInfo["id"], excerptIdentifier, true, false);

            // update button
/*            $("#button-validate").removeClass("validate");
            $("#button-validate").addClass("update");
            $("#button-validate").html("Update");
            $("#button-ignore").removeClass("ignore");
            $("#button-ignore").addClass("ignore-inactive");
            
            $("#button-validate").off('click');
            $("#button-validate").click(function() {
                validateAnnotation(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptIdentifier, true, recognito);
                return true;
            });
            $("#button-ignore").off('click');
            $("#button-ignore").click(function() {
                ignoreExcerpt(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptIdentifier);
                return true;
            });
*/
            // update task assignment information to keep track of the progress more easily
            updateTaskAssignment(taskInfo["id"], completed, currentCount);

            // if auto move on is set, we move automatically to the next excerpt item of the task, except if we are at the end
            if (!taskInfo["level"] || taskInfo["level"] !== "document") {
                if (userInfo["auto_move_on"] == 1 && completed == 0 && ((rank+1) != taskInfo["nb_excerpts"])) {
                    setExcerptView(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank+1);
                } else {
                    setExcerptView(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank);
                }
            } /*else {
                // refresh document view
                $("#sentence-"+excerptIdentifier+"-0").trigger("click");
            }*/
        }
    }

    xhr.send(JSON.stringify(data));
}

function getRandomDarkColor() {
    color = "hsl(" + Math.random() * 360 + ", 50%, 15%)";
    return color;
}

function initLabelColorMap(labelColorMap, labels) {
    if (!labelColorMap)
        labelColorMap = {};
    for (var labelPos in labels) {
        if (!labels[labelPos]["id"])
            continue;
        if (labels[labelPos]["color"]) {
            labelColorMap[labels[labelPos]["id"]] = labels[labelPos]["color"]
        }
    }
    return labelColorMap;
}

function getLabelId(labels, labelName, type) {
    for (var labelPos in labels) {
        const localLabel = labels[labelPos];
        if (localLabel["name"] === labelName && localLabel["type"] === type) 
            return localLabel["id"];
    }
    return null;
}

function createLabelMap(labels) {
    var labelMap = {};
    for(var labelPos in labels) {
        labelMap[labels[labelPos]["id"]] = labels[labelPos]["name"];
    }
    return labelMap;
}

/**
 *  Return true if we only have pre-annotations
 **/
function checkPreAnnotation(annotations) {
    var preAnnotation = true;
    for(var annotationPos in annotations) {
        if (annotations[annotationPos]["source"] === "manual") {
            preAnnotation = false;
            break;
        }
    }
    return preAnnotation;
}

function updateExcerptTaskStatus(taskId, excerptIdentifier, validated, ignored) {
    var urlStr = "tasks/"+taskId+"/excerpt/"+excerptIdentifier;
    if (validated) {
        urlStr += "/validate";
    } else {
        urlStr += "/ignore";
    }
    var url = defineBaseURL(urlStr);

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
            callToaster("toast-top-center", "error", response["detail"], "Damn, saving new excerpt didn't work!");
        } else {
            // nothing more to do normally
        }
    }

    xhr.send(null);   
}
