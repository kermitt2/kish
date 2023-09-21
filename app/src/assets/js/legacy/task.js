/** 
 * The functions to manage tasks
 */ 

// templates
const taskInfoTemplate = "<table style=\"width:100%;\"><tr> \
                        <td style=\"width:15%;font-size:100%;\"><span style=\"color:grey\">Progress:</span> \
                        <span id=\"progress-done\">{{nb_completed_excerpts}}</span> / \
                         {{nb_excerpts}} <span id=\"progress-complete\"></span> </td> \
                        <td style=\"width:20%;\"><span style=\"color:grey\">Task:</span> {{name}} </td> \
                        <td style=\"width:10%;\"><span style=\"color:grey\">Type:</span> {{type}} </td> \
                        <td style=\"width:15%;\"><span style=\"color:grey\">Dataset:</span> {{dataset_name}} </td> \
                        <td style=\"width:10%;\"><span style=\"color:grey\">Task doc.:</span> {{nb_documents}} </td> \
                        <td style=\"width:30%;text-align:right;\"> \
                        <button class=\"mb-1 btn-sm btn-validate-doc\" style=\"display: none;\" id=\"button-document-validation\">Validate doc.</button> \
                        <button class=\"mb-1 btn-sm btn-update-doc\" style=\"display: none;\" id=\"button-document-update\">Update doc.</button> \
                        <button class=\"mb-1 btn-sm btn-ignore-doc\" style=\"display: none;\" id=\"button-document-ignore\">Ignore doc.</button> \
                        <button class=\"mb-1 btn-sm btn-next-doc\" style=\"display: none;\" id=\"previousDocumentButton\">Previous doc.</button> \
                        <button class=\"mb-1 btn-sm btn-next-doc\" style=\"display: none;\" id=\"nextDocumentButton\">Next doc.</button></td> \
                        </tr></table>";

const templateTaskTableHeader = "<thead><tr> \
        <td style=\"width:{{first_col_width}}%;\"></td> \
        <td style=\"width:15%; font-weight: bold;\">{{status}} Task</td> \
        <td style=\"width:10%;\">Type</td> \
        <td style=\"width:15%;\">Dataset</td> \
        <td style=\"width:10%;\"># documents</td> \
        <td style=\"width:7%;\"># excerpts</td> \
        <td style=\"width:10%;\"># completed</td> \
        <td style=\"width:10%;\">Status</td> \
        <td style=\"width:15%;\">Assigned to</td> \
        <td style=\"width:7%;text-align: right;\">Action</td> \
        </tr></thead><tbody>";

const templateTaskRow = "<td></td><td>{{name}}</td><td>{{type}}</td><td>{{dataset_name}}</td><td>{{nb_documents}}</td> \
                        <td>{{nb_excerpts}}</td><td>{{nb_completed_excerpts}}</td><td>{{status}}</td> \
                        <td>{{assigned}}</td>";

function annotationTask(userInfo, taskInfo) {
    /*event.preventDefault();
    clearMainContent();
    $("#annotation-view").show();
    $("#annotate-side-bar").show();
    $("#guidelines-task-id").html(taskInfo["id"]);
    $("#guidelines-side-bar").show();

    $("#annotation-doc-view").show();
    $("#annotation-val-area").show();
    $("#annotation-paging").show();

    activateSideBarMenuChoice($("#annotate-side-bar"));*/

    //setTaskInfo(taskInfo);

    // get the list of excerpt identifiers for the tasks
    var url = defineBaseURL("tasks/"+taskInfo["id"]+"/excerpts");
    if (taskInfo["level"] === "document")
        url = defineBaseURL("tasks/"+taskInfo["id"]+"/documents");

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open("GET", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onloadend = function () {
        var response = JSON.parse(xhr.responseText);
        if (xhr.status == 401) {
            window.location.href = "sign-in.html";
        } else if (xhr.status != 200) {
            // display server level error
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, accessing excepts of the task failed!");
        } else {
            if (taskInfo["level"] === "document") {
                var documents = []
                for (var documentPos in response["records"]["documents"]) {
                    documents.push(response["records"][documentPos]);
                }
                taskInfo["documents"] = documents;

                if(response["records"].hasOwnProperty('first_non_complete'))
                    taskInfo["first_non_complete"] = response["records"]["first_non_complete"];
                else
                    taskInfo["first_non_complete"] = taskInfo["nb_documents"]-1;
            } else {
                var excerpts = []
                for (var excerptPos in response["records"]["excerpts"]) {
                    excerpts.push(response["records"][excerptPos]);
                }
                taskInfo["excerpts"] = excerpts;

                if(response["records"].hasOwnProperty('first_non_complete'))
                    taskInfo["first_non_complete"] = response["records"]["first_non_complete"];
                else
                    taskInfo["first_non_complete"] = taskInfo["nb_excerpts"]-1;
            }
            getTaskLabels(userInfo, taskInfo);
        }
    }
    xhr.send(null);
}

function getTaskLabels(userInfo, taskInfo) {
    // get labels for the dataset and task type, then launch the excerpt view
    //var url = defineBaseURL("datasets/"+taskInfo["dataset_id"]+"/labels?type="+taskInfo["type"]);
    var url = defineBaseURL("datasets/"+taskInfo["dataset_id"]+"/labels");

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open("GET", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onloadend = function () {
        // status
        var response = JSON.parse(xhr.responseText);
        if (xhr.status != 200) {
            // display server level error
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, accessing labels of the dataset failed!");
            $("#annotation-val-area").html("<p>Labels are not available</p>");
        } else {
            var labels = [];
            var otherLabels = []
            for (var labelPos in response["records"]) {
                var localLabelItem = response["records"][labelPos];
                if (taskInfo["type"] == localLabelItem["type"] || 
                    (taskInfo["subtype"] && (taskInfo["subtype"] == localLabelItem["type"])))
                    labels.push(localLabelItem);
                else
                    otherLabels.push(localLabelItem);
            }

            // init color map to be used for annotation/classes view
            var labelColorMap = {}
            labelColorMap = initLabelColorMap(labelColorMap, labels);
            labelColorMap = initLabelColorMap(labelColorMap, otherLabels);

            if (taskInfo["level"] === "document")
                displayDocumentAreaLabeling(userInfo, taskInfo, labels, otherLabels, labelColorMap, taskInfo["first_non_complete"]);
            else
                setExcerptView(userInfo, taskInfo, labels, otherLabels, labelColorMap, taskInfo["first_non_complete"]);
        }
    }
    xhr.send(null);
}

/**
 *  Given a selected task, we display the excerpt of the task at the given rank,
 *  i.e. rank parameter is the index of the excerpt (to be annotated) in the task
 **/
function setExcerptView(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank) {
    // get current task item
    urlString = "tasks/"+taskInfo["id"]+"/excerpt"
    if (rank != null)
        urlString += "?rank="+rank;  
    var url = defineBaseURL(urlString);

    // retrieve the existing task information
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open("GET", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onloadend = function () {
        // status
        var response = JSON.parse(xhr.responseText);
        if (xhr.status == 401) {
            window.location.href = "sign-in.html";
        } else if (xhr.status != 200) {
            // display server level error
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, accessing task records didn't work!");
            $("#annotation-doc-view").html("<p>The task record is not available</p>");
        } else {
            response = response["record"];

            console.log(response);

            displayExcerptArea(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, response);
            displayLabelArea(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, response); 
        }
    }
    xhr.send(null);
}

function displayExcerptArea(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptItem) {
    // here we branch wrt. the type of task, because the annotation components change
    if (taskInfo["type"] === "classification" || 
        (taskInfo["type"] === "reconciliation") && (taskInfo["subtype"] === "classification") ) {
        displayExcerptAreaClassification(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptItem);
    } else {
        displayExcerptAreaLabeling("#annotation-doc-view", userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptItem);
    } 
}

function displayLabelArea(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptItem) {  
    // here we branch wrt. the type of task, because the annotation components change
    if (taskInfo["type"] === "classification" || 
        (taskInfo["type"] === "reconciliation") && (taskInfo["subtype"] === "classification") ) {
        displayLabelAreaClassification(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptItem);
    } else {
        displayLabelAreaLabeling(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptItem);
    }
}

function setTaskInfo(taskInfo) {

    console.log("setTaskInfo");
    console.log(taskInfo);

    if (taskInfo == null) {
        $("#annotation-task-info").html("The task is not available");
    } else {
        var taskContent;

        if (taskInfo["level"] === "document") {
            taskContent = taskInfoTemplate
                    .replace("{{nb_completed_excerpts}}", taskInfo["nb_completed_documents"])
                    .replace("{{nb_excerpts}}", taskInfo["nb_documents"]);
            if (taskInfo["nb_completed_documents"] === taskInfo["nb_documents"]) {
                $("#progress-complete").html("<span style=\"color: green;\">Completed !</span>");
            }
        } else {
            taskContent = taskInfoTemplate
                    .replace("{{nb_completed_excerpts}}", taskInfo["nb_completed_excerpts"])
                    .replace("{{nb_excerpts}}", taskInfo["nb_excerpts"]);
            if (taskInfo["nb_completed_excerpts"] === taskInfo["nb_excerpts"]) {
                $("#progress-complete").html("<span style=\"color: green;\">Completed !</span>");
            }
        }
        
        if (taskInfo["name"])
            taskContent = taskContent.replace("{{name}}", taskInfo["name"]);
        if (taskInfo["type"])
            taskContent = taskContent.replace("{{type}}", taskInfo["type"]);
        if (taskInfo["dataset_name"])
            taskContent = taskContent.replace("{{dataset_name}}", taskInfo["dataset_name"]);
        if (taskInfo["nb_documents"])
            taskContent = taskContent.replace("{{nb_documents}}", taskInfo["nb_documents"]);
        
        console.log($("#annotation-task-info"));
        $("#annotation-task-info").html(taskContent);

        if (taskInfo["level"] === "document") {
            if (taskInfo["nb_completed_documents"] === taskInfo["nb_documents"]) {
                $("#progress-complete").html("<span style=\"color: green;\">Completed !</span>");
            }
        } else {
            if (taskInfo["nb_completed_excerpts"] === taskInfo["nb_excerpts"]) {
                $("#progress-complete").html("<span style=\"color: green;\">Completed !</span>");
            }
        }
    }
}

/*
function displayTasks(userInfo) {
    $("#my-task-view").show();
    var url = defineBaseURL("tasks/user");
    // retrieve the existing task information assigned to the current user 
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onloadend = function () {
        // status
        if (xhr.status == 401) {
            // unauthorized, move to login screen
            window.location.href = "sign-in.html";
        } else if (xhr.status != 200) {
            // display server level error
            var response = JSON.parse(xhr.responseText);
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, accessing tasks didn't work!");
            $("#active-task-view-table").html("<tr><td>No tasks available</td></tr>");
            $("#assigned-task-view-table").html("<tr><td>No tasks available</td></tr>");
            $("#completed-task-view-table").html("<tr><td>No tasks available</td></tr>");
        } else {
            // otherwise go through the tasks
            var response = JSON.parse(xhr.responseText);
            if (response["records"].length == 0) {
                $("#active-task-view-table").html("<tr><td>No tasks available</td></tr>");
                $("#assigned-task-view-table").html("<tr><td>No tasks available</td></tr>");
                $("#completed-task-view-table").html("<tr><td>No tasks available</td></tr>");
            } else {
                var tableContent = templateTaskTableHeader;
                tableContent = tableContent.replace("{{first_col_width}}", "0");
                var tableContentCompleted = tableContent.replace("{{status}}", "");
                var tableContentInProgress = tableContent.replace("{{status}}", "");
                var tableContentAssigned = tableContent.replace("{{status}}", "");

                var hasCompletedTask = false;
                var hasInProgressTask = false;
                var hasAssignedTask = false;
                for(var pos in response["records"]) {
                    const localAssignedTask = response["records"][pos];
                    //console.log(localAssignedTask);

                    if (localAssignedTask["is_completed"] == 1 || localAssignedTask["is_completed"] == true) {
                        // task is done
                        tableContentCompleted += "<tr id=\"active-task-"+pos+"\"></tr>\n";
                        hasCompletedTask = true;
                    } else if (localAssignedTask["in_progress"] == 1 || localAssignedTask["completed_excerpts"]>0) {
                        // active task in progress
                        tableContentInProgress += "<tr id=\"active-task-"+pos+"\"></tr>\n";
                        hasInProgressTask = true;
                    } else {
                        // task simply assigned
                        tableContentAssigned += "<tr id=\"active-task-"+pos+"\"></tr>\n";
                        hasAssignedTask = true;
                    }
                }

                tableContentCompleted += "</tbody>";
                tableContentInProgress += "</tbody>";
                tableContentAssigned += "</tbody>";

                if (hasCompletedTask)
                    $("#completed-task-view-table").html(tableContentCompleted);
                else
                    $("#completed-task-view-table").html("<tr><td>No completed task yet</td></tr>");

                if (hasInProgressTask)
                    $("#active-task-view-table").html(tableContentInProgress);
                else
                    $("#active-task-view-table").html("<tr><td>No active in progress task yet</td></tr>");

                if (hasAssignedTask)
                    $("#assigned-task-view-table").html(tableContentAssigned);
                else
                    $("#assigned-task-view-table").html("<tr><td>No assigned task - select open tasks in Datasets view !</td></tr>");

                for(var pos in response["records"]) {
                    displayTask(userInfo, "active", pos, response["records"][pos]["task_id"]);
                }
            }
        }
    };

    xhr.send(null);
}
*/

/*
async function displayTask(userInfo, table, pos, taskIdentifier) {
    var url = defineBaseURL("tasks/"+taskIdentifier);

    // retrieve the existing task information
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onloadend = async function () {
        // status
        if (xhr.status != 200) {
            // display server level error
            var response = JSON.parse(xhr.responseText);
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, accessing task didn't work!");
        } else {
            // otherwise display the task information
            var response = JSON.parse(xhr.responseText);
            response = response["record"]
            displayTaskItem(userInfo, table, pos, response);
        }
    };

    xhr.send(null);
}
*/

/*
async function displayTaskItem(userInfo, table, pos, taskItem) {
    var taskIdentifier = taskItem["id"];
    var taskContent = templateTaskRow;

    if (taskItem["name"])
        taskContent = taskContent.replace("{{name}}", taskItem["name"]);
    else 
        taskContent = taskContent.replace("{{name}}", "");

    if (taskItem["type"])
        taskContent = taskContent.replace("{{type}}", taskItem["type"]);
    else
        taskContent = taskContent.replace("{{type}}", "");

    if (taskItem["dataset_name"])
        taskContent = taskContent.replace("{{dataset_name}}", taskItem["dataset_name"]);
    else
        taskContent = taskContent.replace("{{dataset_name}}", "");

    if (taskItem["nb_documents"])
        taskContent = taskContent.replace("{{nb_documents}}", taskItem["nb_documents"]);
    else
        taskContent = taskContent.replace("{{nb_documents}}", "0");

    if (taskItem["nb_excerpts"])
        taskContent = taskContent.replace("{{nb_excerpts}}", taskItem["nb_excerpts"]);
    else
        taskContent = taskContent.replace("{{nb_excerpts}}", "0");

    if (taskItem["level"] === "document") {
        if (taskItem["nb_completed_documents"]) {
            if (taskItem["nb_documents"])
                taskContent = taskContent.replace("{{nb_completed_excerpts}}", taskItem["nb_completed_documents"] + " / " + taskItem["nb_documents"] + " doc.");
            else
                taskContent = taskContent.replace("{{nb_completed_excerpts}}", taskItem["nb_completed_documents"] + " doc.");
        } else 
            taskContent = taskContent.replace("{{nb_completed_excerpts}}", "0");
    } else {
        if (taskItem["nb_completed_excerpts"]) {
            if (taskItem["nb_excerpts"])
                taskContent = taskContent.replace("{{nb_completed_excerpts}}", taskItem["nb_completed_excerpts"] + " / " + taskItem["nb_excerpts"] + " excepts");
            else
                taskContent = taskContent.replace("{{nb_completed_excerpts}}", taskItem["nb_completed_excerpts"] + " excerpt");
        } else
            taskContent = taskContent.replace("{{nb_completed_excerpts}}", "0");
    }

    if (taskItem["status"]) {
        if (taskItem["status"] == "completed") {
            taskContent = taskContent.replace("{{status}}", "<span style=\"color: green;\">completed</span>");
        } else {
            taskContent = taskContent.replace("{{status}}", taskItem["status"]);
        }
    } else
        taskContent = taskContent.replace("{{status}}", "unknown");

    if (taskItem["assigned"])
        taskContent = taskContent.replace("{{assigned}}", taskItem["assigned"]);
    else
        taskContent = taskContent.replace("{{assigned}}", "");

    var origin = "-dataset";
    if (taskItem["dataset_id"]) {
        origin += "-" + taskItem["dataset_id"];
    }
    if ($("#tasks-home").hasClass("active")) 
        origin = "";

    if (taskItem["assigned"]) {
        if (taskItem["assigned"] === userInfo["email"]) {
            taskContent += "<td style=\"text-align: right;\"><span class=\"clickable\" id=\"self-assign" + origin + "-task-"+pos+
                "\" style=\"color:orange;\"><i class=\"mdi mdi-minus\"/></span> &nbsp; " + 
                "<span class=\"clickable\" id=\"annotate" + origin + "-task-"+pos+
                "\" style=\"color:green;\"><i class=\"mdi mdi-border-color\"/></span></td>";
        } else {
            taskContent += "<td style=\"text-align: right;\"><span id=\"self-assign" + origin + "-task-"+pos+
                "\" style=\"color:grey;\"><i class=\"mdi mdi-minus\"/></span> &nbsp; " + 
                "<span id=\"annotate" + origin + "-task-"+pos+
                "\" style=\"color:grey;\"><i class=\"mdi mdi-border-color\"/></span></td>";
        }
    } else {
        // is this task redundant with one already assigned to the user ? 
        // or is it a reconciliation task that can't be assigned given user's role? 
        if (
            (userInfo["redundant_tasks"].indexOf(taskIdentifier) != -1 && taskItem["type"] !== "reconciliation") ||
            (userInfo["role"] === "annotator" && taskItem["type"] === "reconciliation")
            ) {
            taskContent += "<td style=\"text-align: right;\"><span class=\"clickable\" id=\"self-assign" + origin + "-task-"+pos+
            "\" style=\"color:grey;\"><i class=\"mdi mdi-plus\"/></span> &nbsp; " + 
            "<span id=\"annotate" + origin + "-task-"+pos+
            "\" style=\"color:grey;\"><i class=\"mdi mdi-border-color\"/></span></td>";
        } else {
            taskContent += "<td style=\"text-align: right;\"><span class=\"clickable\" id=\"self-assign" + origin + "-task-"+pos+
            "\" style=\"color:green;\"><i class=\"mdi mdi-plus\"/></span> &nbsp; " + 
            "<span id=\"annotate" + origin + "-task-"+pos+
            "\" style=\"color:grey;\"><i class=\"mdi mdi-border-color\"/></span></td>";
        }
    }
    
    await $("#"+table+"-task-"+pos).html(taskContent);
    setTimeout(function() {
        if (taskItem["assigned"]) {
            if (taskItem["assigned"] === userInfo["email"]) {
                $("#self-assign" + origin + "-task-"+pos).click(function() {
                    selfUnassignTask(userInfo, taskIdentifier);
                    taskItem["assigned"] = null;
                    taskItem["status"] = "unassigned";
                    displayTaskItem(userInfo, table, pos, taskItem);
                });
                $("#annotate" + origin + "-task-"+pos).click(function() {
                    annotationTask(userInfo, taskItem);
                });
            } else {
                if (userInfo["role"] !== "annotator") {
                    $("#self-assign" + origin + "-task-"+pos).click(function() {
                        unAssignTask(userInfo, taskIdentifier);
                        taskItem["assigned"] = null;
                        taskItem["status"] = "unassigned";
                        displayTaskItem(userInfo, table, pos, taskItem);
                    });
                }
            }
        } else {
            if (userInfo["redundant_tasks"].indexOf(taskIdentifier) == -1 || 
                (taskItem["type"] === "reconciliation" && userInfo["role"] !== "annotator")) {
                $("#self-assign" + origin + "-task-"+pos).click(function() {
                    selfAssignTask(userInfo, taskIdentifier);
                    taskItem["assigned"] = userInfo["email"];
                    taskItem["status"] = "assigned";
                    displayTaskItem(userInfo, table, pos, taskItem);
                });
            } 
        }
    }, 0);
}
*/
