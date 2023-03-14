/** 
 * The functions to manage tasks
 */ 

// templates
const taskInfoTemplate = "<table style=\"width:100%;\"><tr> \
                        <td style=\"width:40%;font-size:150%;\"><span style=\"color:grey\">Progress:</span> \
                        <span id=\"progress-done\">{{nb_completed_excerpts}}</span> / \
                         {{nb_excerpts}} <span id=\"progress-complete\"></span> </td> \
                        <td style=\"width:15%;\"><span style=\"color:grey\">Task:</span> {{name}} </td> \
                        <td style=\"width:15%;\"><span style=\"color:grey\">Type:</span> {{type}} </td> \
                        <td style=\"width:15%;\"><span style=\"color:grey\">Dataset:</span> {{dataset_name}} </td> \
                        <td style=\"width:15%;\"><span style=\"color:grey\">Task doc.:</span> {{nb_documents}} </td> \
                        </tr></table>";

const templateTaskTableHeader = "<thead><tr> \
        <td style=\"width:{{first_col_width}}%;\"></td> \
        <td style=\"width:15%; font-weight: bold;\">{{status}} Task</td> \
        <td style=\"width:10%;\">Type</td> \
        <td style=\"width:10%;\">Dataset</td> \
        <td style=\"width:10%;\"># documents</td> \
        <td style=\"width:10%;\"># excerpts</td> \
        <td style=\"width:10%;\"># completed</td> \
        <td style=\"width:10%;\">Status</td> \
        <td style=\"width:15%;\">Assigned to</td> \
        <td style=\"width:10%;text-align: right;\">Action</td> \
        </tr></thead><tbody>";

const templateTaskRow = "<td></td><td>{{name}}</td><td>{{type}}</td><td>{{dataset_name}}</td><td>{{nb_documents}}</td> \
                        <td>{{nb_excerpts}}</td><td>{{nb_completed_excerpts}}</td><td>{{status}}</td> \
                        <td>{{assigned}}</td>";

function annotationTask(userInfo, taskInfo) {
    event.preventDefault();
    clearMainContent();
    $("#annotation-view").show();
    $("#annotate-side-bar").show();
    $("#guidelines-task-id").html(taskInfo["id"]);
    $("#guidelines-side-bar").show();

    activateSideBarMenuChoice($("#annotate-side-bar"));

    setTaskInfo(taskInfo);

    // get the list of excerpt identifiers for the tasks
    var url = defineBaseURL("tasks/"+taskInfo["id"]+"/excerpts");

    var xhr = new XMLHttpRequest();
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
            var excerpts = []
            for (var excerptPos in response["records"]["excerpts"]) {
                excerpts.push(response["records"][excerptPos]);
            }
            taskInfo["excerpts"] = excerpts;

            if(response["records"].hasOwnProperty('first_non_complete'))
                taskInfo["first_non_complete"] = response["records"]["first_non_complete"];
            else
                taskInfo["first_non_complete"] = taskInfo["nb_excerpts"]-1;

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
            setExcerptView(userInfo, taskInfo, labels, otherLabels, taskInfo["first_non_complete"]);
        }
    }
    xhr.send(null);
}

/**
 *  Given a selected task, we display the excerpt of the task at the given rank,
 *  i.e. rank parameter is the index of the excerpt (to be annotated) in the task
 **/
function setExcerptView(userInfo, taskInfo, labels, otherLabels, rank) {
    // get current task item
    urlString = "tasks/"+taskInfo["id"]+"/excerpt"
    if (rank != null)
        urlString += "?rank="+rank;  
    var url = defineBaseURL(urlString);

    // retrieve the existing task information
    var xhr = new XMLHttpRequest();
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

            displayExcerptArea(userInfo, taskInfo, labels, otherLabels, rank, response);
            displayLabelArea(userInfo, taskInfo, labels, otherLabels, rank, response["id"]); 
        }
    }
    xhr.send(null);
}

function displayExcerptArea(userInfo, taskInfo, labels, otherLabels, rank, excerptItem) {
    // here we branch wrt. the type of task, because the annotation components change
    if (taskInfo["type"] === "classification" || 
        (taskInfo["type"] === "reconciliation") && (taskInfo["subtype"] === "classification") ) {
        // document type branch: either text or PDF
        displayExcerptAreaClassification(userInfo, taskInfo, labels, otherLabels, rank, excerptItem);
    } else {
        // document type branch: either text or PDF
        displayExcerptAreaLabeling(userInfo, taskInfo, labels, otherLabels, rank, excerptItem);
    } 
}

function displayLabelArea(userInfo, taskInfo, labels, otherLabels, rank, excerptIdentifier) {  
    // here we branch wrt. the type of task, because the annotation components change
    if (taskInfo["type"] === "classification" || 
        (taskInfo["type"] === "reconciliation") && (taskInfo["subtype"] === "classification") ) {
        // document type branch: either text or PDF
        displayLabelAreaClassification(userInfo, taskInfo, labels, otherLabels, rank, excerptIdentifier);
    } else {
        // document type branch: either text or PDF
        displayLabelAreaLabeling(userInfo, taskInfo, labels, otherLabels, rank, excerptIdentifier);
    }
}

function setTaskInfo(taskInfo) {
    if (taskInfo == null) {
        $("#annotation-task-info").html("The task is not available");
    } else {
        var taskContent = taskInfoTemplate
                    .replace("{{nb_completed_excerpts}}", taskInfo["nb_completed_excerpts"])
                    .replace("{{nb_excerpts}}", taskInfo["nb_excerpts"]);
        
        if (taskInfo["name"])
            taskContent = taskContent.replace("{{name}}", taskInfo["name"]);
        if (taskInfo["type"])
            taskContent = taskContent.replace("{{type}}", taskInfo["type"]);
        if (taskInfo["dataset_name"])
            taskContent = taskContent.replace("{{dataset_name}}", taskInfo["dataset_name"]);
        if (taskInfo["nb_documents"])
            taskContent = taskContent.replace("{{nb_documents}}", taskInfo["nb_documents"]);
        
        $("#annotation-task-info").html(taskContent);
    }
}

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

function displayTask(userInfo, table, pos, taskIdentifier) {
    var url = defineBaseURL("tasks/"+taskIdentifier);

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
            callToaster("toast-top-center", "error", response["detail"], "Damn, accessing task didn't work!");
        } else {
            // otherwise display the task information
            var response = JSON.parse(xhr.responseText);
            response = response["record"]
            var taskContent = templateTaskRow;

            if (response["name"])
                taskContent = taskContent.replace("{{name}}", response["name"]);
            else 
                taskContent = taskContent.replace("{{name}}", "");

            if (response["type"])
                taskContent = taskContent.replace("{{type}}", response["type"]);
            else
                taskContent = taskContent.replace("{{type}}", "");

            if (response["dataset_name"])
                taskContent = taskContent.replace("{{dataset_name}}", response["dataset_name"]);
            else
                taskContent = taskContent.replace("{{dataset_name}}", "");

            if (response["nb_documents"])
                taskContent = taskContent.replace("{{nb_documents}}", response["nb_documents"]);
            else
                taskContent = taskContent.replace("{{nb_documents}}", "0");

            if (response["nb_excerpts"])
                taskContent = taskContent.replace("{{nb_excerpts}}", response["nb_excerpts"]);
            else
                taskContent = taskContent.replace("{{nb_excerpts}}", "0");

            if (response["nb_completed_excerpts"])
                taskContent = taskContent.replace("{{nb_completed_excerpts}}", response["nb_completed_excerpts"]);
            else
                taskContent = taskContent.replace("{{nb_completed_excerpts}}", "0");

            if (response["status"]) {
                if (response["status"] == "completed") {
                    taskContent = taskContent.replace("{{status}}", "<span style=\"color: green;\">completed</span>");
                } else {
                    taskContent = taskContent.replace("{{status}}", response["status"]);
                }
            }
            else
                taskContent = taskContent.replace("{{status}}", "unknown");

            if (response["assigned"])
                taskContent = taskContent.replace("{{assigned}}", response["assigned"]);
            else
                taskContent = taskContent.replace("{{assigned}}", "");

            var origin = "-dataset";
            if ($("#tasks-home").hasClass("active")) 
                origin = "";

            if (response["assigned"]) {
                if (response["assigned"] === userInfo["email"]) {
                    taskContent += "<td style=\"text-align: right;\"><a href=\"#\"><span id=\"self-assign" + origin + "-task-"+pos+
                        "\" style=\"color:orange;\"><i class=\"mdi mdi-minus\"/></span></a> &nbsp; " + 
                        "<a href=\"#\"><span id=\"annotate" + origin + "-task-"+pos+
                        "\" style=\"color:green;\"><i class=\"mdi mdi-border-color\"/></span></a></td>";
                } else {
                    taskContent += "<td style=\"text-align: right;\"><a href=\"#\"><span id=\"self-assign" + origin + "-task-"+pos+
                        "\" style=\"color:grey;\"><i class=\"mdi mdi-minus\"/></span></a> &nbsp; " + 
                        "<a href=\"#\"><span id=\"annotate" + origin + "-task-"+pos+
                        "\" style=\"color:grey;\"><i class=\"mdi mdi-border-color\"/></span></a></td>";
                }
            } else {
                // is this task redundant with one already assigned to the user ? 
                // or is it a reconciliation task that can't be assigned given user's role? 
                if ((userInfo["redundant_tasks"].indexOf(taskIdentifier) != -1 && response["type"] !== "reconciliation")||
                    (userInfo["role"] === "annotator" && response["type"] === "reconciliation")
                    ) {
                    taskContent += "<td style=\"text-align: right;\"><a href=\"#\"><span id=\"self-assign" + origin + "-task-"+pos+
                    "\" style=\"color:grey;\"><i class=\"mdi mdi-plus\"/></span></a> &nbsp; " + 
                    "<a href=\"#\"><span id=\"annotate" + origin + "-task-"+pos+
                    "\" style=\"color:grey;\"><i class=\"mdi mdi-border-color\"/></span></a></td>";
                } else {
                    taskContent += "<td style=\"text-align: right;\"><a href=\"#\"><span id=\"self-assign" + origin + "-task-"+pos+
                    "\" style=\"color:green;\"><i class=\"mdi mdi-plus\"/></span></a> &nbsp; " + 
                    "<a href=\"#\"><span id=\"annotate" + origin + "-task-"+pos+
                    "\" style=\"color:grey;\"><i class=\"mdi mdi-border-color\"/></span></a></td>";
                }
            }
            
            $("#"+table+"-task-"+pos).html(taskContent);

            if (response["assigned"]) {
                if (response["assigned"] === userInfo["email"]) {
                    $("#self-assign" + origin + "-task-"+pos).click(function() {
                        selfUnassignTask(userInfo, taskIdentifier);
                        return true;
                    });
                    $("#annotate" + origin + "-task-"+pos).click(function() {
                        annotationTask(userInfo, response);
                        return true;
                    });
                } else {
                    $("#self-deassign" + origin + "-task-"+pos).click(function() {
                        unAssignTask(userInfo, taskIdentifier);
                        return true;
                    });
                }
            } else {
                if (userInfo["redundant_tasks"].indexOf(taskIdentifier) == -1 || 
                    (response["type"] === "reconciliation" && userInfo["role"] !== "annotator")) {
                    $("#self-assign" + origin + "-task-"+pos).click(function() {
                        selfAssignTask(userInfo, taskIdentifier);
                        return true;
                    });
                } 
            }
        }
    };

    xhr.send(null);
}

function selfAssignTask(userInfo, taskIdentifier) {
    event.preventDefault();
    var url = defineBaseURL("tasks/"+taskIdentifier+"/assign");

    // retrieve the existing task information
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onloadend = function () {
        // status
        if (xhr.status != 200) {
            // display server level error
            // Note: assignment can be refused if the task has been assigned to someone else in between ! 
            var response = JSON.parse(xhr.responseText);
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, task self-assignment didn't work!");
        } else {
            // add new redundant tasks
            var response = JSON.parse(xhr.responseText);
            if (response["records"]) {
                var records = response["records"];
                for (recordPos in records) {
                    var record = records[recordPos];
                    if (userInfo["redundant_tasks"].indexOf(record) == -1) {
                        userInfo["redundant_tasks"].push(record);
                    }
                }
            }
            callToaster("toast-top-center", "success", "Success!", "Self-assignment to task");
            if ($("#tasks-home").hasClass("active"))
                displayTasks(userInfo);
            else
                displayDatasets(userInfo);
        }
    }

    xhr.send(null);
}

function selfUnassignTask(userInfo, taskIdentifier) {
    event.preventDefault();
    var url = defineBaseURL("tasks/"+taskIdentifier+"/assign");

    // retrieve the existing task information
    var xhr = new XMLHttpRequest();
    xhr.open("DELETE", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onloadend = function () {
        // status
        if (xhr.status != 200) {
            // display server level error
            var response = JSON.parse(xhr.responseText);
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, task self-unassignment didn't work!");
        } else {
            // remove old redundant tasks
            var response = JSON.parse(xhr.responseText);
            if (response["records"]) {
                var records = response["records"];
                for (recordPos in records) {
                    const record = records[recordPos];
                    const ind = userInfo["redundant_tasks"].indexOf(record);
                    if (ind != -1) {
                        userInfo["redundant_tasks"].splice(ind, 1);
                    }
                }
            }

            callToaster("toast-top-center", "success", "Success!", "Self-unassignment from the task");
            if ($("#tasks-home").hasClass("active"))
                displayTasks(userInfo);
            else                
                displayDatasets(userInfo);
        }
    }

    xhr.send(null);
}
