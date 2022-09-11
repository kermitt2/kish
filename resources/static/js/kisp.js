/**
*  Javascript functions for the front end single page application.
*
*  Author: Patrice Lopez
*/

var kisp = (function($) {

    var userInfo = null;

    setAuthenticatedUserInfo();
    callToaster("toast-top-center", "success", "Welcome to KISP", "Yo!");

    $(document).ready(function() {
        $("#user-settings").hide();
        $('#user-settings-menu').click(function() {
            clearMainContent();
            settings();
            $("#user-settings").show();
            return true;
        });

        $("#logout").click(function() {
            logout();
            return true;
        });

        $('#update-settings-button').click(function() {
            event.preventDefault();
            update_settings();
        });

        $("#tasks-home").click(function() {
            clearMainContent();
            displayTasks();
            return true;
        });

        $("#users-home").click(function() {
            clearMainContent();
            displayUsers();
            return true;
        });

        $("#datasets-home").click(function() {
            clearMainContent();
            displayDatasets();
            return true;
        });

    });

    function clearMainContent() {
        $("#user-settings").hide();
        $("#task-view").hide();
        $("#user-view").hide();
        $("#dataset-view").hide();
        $("#annotation-view").hide();
    }

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

    function setAuthenticatedUserInfo() {
        var url = defineBaseURL("users/me");

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true); 
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onloadend = function () {
            // status
            if (xhr.status == 200) {
                userInfo = JSON.parse(xhr.responseText);
                updateUserSettings();
                console.log(userInfo);

                if (userInfo["role"] == "admin") {
                    $("#users-home").show();
                }

            } else {
                // not authorized, redirect to login page (note it should not happen 
                // as the page would be served under a protected route)
                window.location.href = "sign-in.html";
            }
        };

        xhr.send(null);
    }

    function updateUserSettings() {
        $('#display-name-header').html(userInfo["email"]);
        document.querySelector("body").style.visibility = "visible";
        var nameSpace = "";
        if (userInfo["first_name"]) 
            nameSpace += userInfo["first_name"] + " ";
        if (userInfo["last_name"]) 
            nameSpace += userInfo["last_name"] + " ";
        nameSpace += "<small class=\"pt-1\">" + userInfo["email"] + "</small>";
        $('#display-name').html(nameSpace);
        $('#display-role').html("<small class=\"pt-1\">" + userInfo["role"] + "</small>");
    }

    function logout() {
        var url = defineBaseURL("auth/jwt/logout");

        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true); 
        
        xhr.onloadend = function () {
            // status
            if (xhr.status == 200) {
                // display server level error
                userInfo = JSON.parse(xhr.responseText);
                console.log(userInfo);
                // redirect to login page 
                window.location.href = "sign-in.html";
            } else if (xhr.status == 401) {
                window.location.href = "sign-in.html";
            }
        };
        xhr.send(null);
    }

    function settings() {
        $("#email").val(userInfo["email"]);
        //$("#email").addclass(readonly);
        $("#firstName").val(userInfo["first_name"]);
        $("#lastName").val(userInfo["last_name"]);
    }

    function callToaster(positionClass, type, msg, greetings) {
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
                timeOut: "5000",
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
    
    function update_settings() {
        var email = $("#email").val();
        var forname = $("#firstName").val();
        var lastname = $("#lastName").val();
        var password = $("#newPassword").val();
        var cpassword = $("#conPassword").val();
        var oldpassword = $('#oldPassword').val();

        if(validate_settings(email, forname, lastname, oldpassword, password, cpassword)) {
            // update password
            url = defineBaseURL("users/me");
            var data = {};
            data["email"] = email;

            // if password changed
            if (password.lenght > 0)
                data["password"] = password;
            else
                data["password"] = oldpassword;

            if (forname != null && forname.length > 0)
                data["first_name"] = forname;
            if (lastname != null && lastname.length > 0)
                data["last_name"] = lastname;

            var xhr = new XMLHttpRequest();
            xhr.open("PATCH", url, true);
            xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

            xhr.onloadend = function () {
                // status
                if (xhr.status != 200 && xhr.status != 201) {
                    // display server level error
                    var response = JSON.parse(xhr.responseText);
                    console.log(response["detail"]);
                    $('#div-submit').append("<div class=\"invalid-feedback\" style=\"color:red; display:inline;\">Error user registration: <br/>"+
                        response["detail"]+"</div>");
                    callToaster("toast-top-center", "error", response["detail"], "Didn't work!");
                } else {
                    // otherwise update is done, update local user settings and notify the change
                    userInfo = JSON.parse(xhr.responseText);
                    updateUserSettings();
                    callToaster("toast-top-center", "success", "Your profile is updated", "Yes!");
                }
            };

            // send the collected data as JSON
            xhr.send(JSON.stringify(data));
        }
    }

    function validate_settings(email, forname, lastname, oldpassword, password, cpassword) {
        var validation = true;

        const feedback = document.querySelectorAll('.invalid-feedback');
        feedback.forEach(feedb => {
            feedb.remove();
        });

        // in case it is editable
        $("#email").removeClass("is-invalid");
        $("#email").removeClass("is-valid");
        if (email === "") {
            $("#email").addClass("is-invalid");
            $("#div-email").append("<div class=\"invalid-feedback\">Please enter an email</div>");
            validation = false;
        } else if (email.indexOf("@") == -1) {
            $("#email").addClass("is-invalid");
            $("#div-email").append("<div class=\"invalid-feedback\">It does not look like an email</div>");
            validation = false;
        } else {
            $("#email").addClass("is-valid");
        }

        $("#oldPassword").removeClass("is-invalid");
        $("#oldPassword").removeClass("is-valid");
        if (oldpassword === "") {
            $("#oldPassword").addClass("is-invalid");
            $("#div-oldPassword").append("<div class=\"invalid-feedback\">Please enter your current password</div>");
            validation = false;
        } else if (oldpassword.length < 8) {
            $("#oldPassword").addClass("is-invalid");
            $("#div-oldPassword").append("<div class=\"invalid-feedback\">Password must have at least 8 characters</div>");
            validation = false;
        } else {
            $("#oldPassword").addClass("is-valid");
        }

        $("#newPassword").removeClass("is-invalid");
        $("#newPassword").removeClass("is-valid");
        /*if (password === "") {
            $("#newPassword").addClass("is-invalid");
            $("#div-newPassword").append("<div class=\"invalid-feedback\">Please enter a new password</div>");
            validation = false;
        } else*/ 
        if (password !== "" && password.length < 8) {
            $("#newPassword").addClass("is-invalid");
            $("#div-newPassword").append("<div class=\"invalid-feedback\">Password must have at least 8 characters</div>");
            validation = false;
        } else {
            $("#newPassword").addClass("is-valid");
        }

        $("#conPassword").removeClass("is-invalid");
        $("#conPassword").removeClass("is-valid");
        if (cpassword === "" && password.length>0) {
            $("#conPassword").addClass("is-invalid");
            $("#div-conPassword").append("<div class=\"invalid-feedback\">Please enter a confirmation password</div>");
            validation = false;
        } else if (cpassword.length < 8 && password.length>0) {
            $("#conPassword").addClass("is-invalid");
            $("#div-conPassword").append("<div class=\"invalid-feedback\">Password must have at least 8 characters</div>");
            validation = false;
        } else if (password.length >= 8 && password !== cpassword) {
            $("#conPassword").addClass("is-invalid");
            $("#conPassword").addClass("is-invalid");
            $("#div-conPassword").append("<div class=\"invalid-feedback\">New and confirmation passwords do not match</div>");
            validation = false;
        } else {
            $("#conPassword").addClass("is-valid");
        }

        return validation;
    }

    function displayDatasets() {
        $("#dataset-view").show();
        var url = defineBaseURL("datasets");

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
                callToaster("toast-top-center", "error", response["detail"], "Damn, accessing datasets didn't work!");
                $("#dataset-view-table").html("<tr><td>No dataset available</td></tr>");
            } else {
                // otherwise go through the datasets
                var response = JSON.parse(xhr.responseText);
                if (response["records"].length == 0) {
                    $("#dataset-view-table").html("<tr><td>No dataset available</td></tr>");
                } else {
                    var tableContent = 
                        "<thead><tr><td style=\"width:10%;\"></td>" + 
                        "<td style=\"width:10%;\">Dataset</td><td style=\"width:30%;\">Description</td>"+
                        "<td style=\"width:10%;\"># documents</td><td style=\"width:10%;\"># excerpts</td><td style=\"width:10%;\"># tasks</td>"+
                        "<td style=\"width:20%;\">Action</td></tr></thead><tbody>";
                    for(var pos in response["records"]) {
                        tableContent += "<tr id=\"dataset-"+pos+"\"></tr>\n";
                    }
                    tableContent += "</tbody>";
                    $("#dataset-view-table").html(tableContent);
                    for(var pos in response["records"]) {
                        displayDataset(pos, response["records"][pos]);
                    }
                }
            }
        };

        xhr.send(null);
    }

    function displayDataset(pos, datasetIdentifier) {
        var url = defineBaseURL("datasets/"+datasetIdentifier);

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
                callToaster("toast-top-center", "error", response["detail"], "Damn, accessing datasets didn't work!");
            } else {
                // otherwise display the dataset information
                var response = JSON.parse(xhr.responseText);
                response = response["record"]
                //console.log(response)
                var datasetContent = "<td><img src=\""+response["image_url"]+"\" width=\"50\" height=\"50\"/></td><td>"+response["name"]+"</td>";
                if (response["description"])
                    datasetContent += "<td>"+response["description"]+"</td>";
                else
                    datasetContent += "<td></td>";
                if (response["nb_documents"])
                    datasetContent += "<td>"+response["nb_documents"]+"</td>";
                else
                    datasetContent += "<td>0</td>";
                if (response["nb_excerpts"])
                    datasetContent += "<td>"+response["nb_excerpts"]+"</td>";
                else
                    datasetContent += "<td>0</td>";
                if (response["nb_tasks"])
                    datasetContent += "<td>"+response["nb_tasks"]+"</td>";
                else
                    datasetContent += "<td>0</td>";
                datasetContent += "<td><span style=\"color:orange;\"><i class=\"mdi mdi-account-edit\"/></span> &nbsp; " + 
                    "<a href=\"#\"><span id=\"delete-dataset-"+pos+"\" style=\"color:red;\"><i class=\"mdi mdi-delete\"/></span></a></td>";
                $("#dataset-"+pos).html(datasetContent);
                $("#delete-dataset-"+pos).click(function() {
                    deleteDataset(datasetIdentifier);
                    //clearMainContent();
                    return true;
                });
                //console.log(datasetContent);
            }
        };

        // send the collected data as JSON
        xhr.send(null);
    }

    function displayTasks() {
        $("#task-view").show();
        var url = defineBaseURL("tasks");

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
                callToaster("toast-top-center", "error", response["detail"], "Damn, accessing tasks didn't work!");
                $("#task-view-table").html("<tr><td>No tasks available</td></tr>");
            } else {
                // otherwise go through the tasks
                var response = JSON.parse(xhr.responseText);
                if (response["records"].length == 0) {
                    $("#task-view-table").html("<tr><td>No tasks available</td></tr>");
                } else {
                    var tableContent = 
                        "<thead><tr>" + 
                        "<td style=\"width:15%;\">Task</td>"+
                        "<td style=\"width:10%;\">Type</td>"+
                        "<td style=\"width:10%;\">Dataset</td>"+
                        "<td style=\"width:10%;\"># documents</td>"+
                        "<td style=\"width:10%;\"># excerpts</td>"+
                        "<td style=\"width:10%;\"># annotations</td>"+
                        "<td style=\"width:10%;\">Status</td>"+
                        "<td style=\"width:10%;\">Assigned to</td>"+
                        "<td style=\"width:15%;\">Action</td>"+
                        "</tr></thead><tbody>";
                    for(var pos in response["records"]) {
                        tableContent += "<tr id=\"task-"+pos+"\"></tr>\n";
                    }
                    tableContent += "</tbody>";
                    $("#task-view-table").html(tableContent);
                    for(var pos in response["records"]) {
                        displayTask(pos, response["records"][pos]);
                    }
                }
            }
        };

        xhr.send(null);
    }

    function displayTask(pos, taskIdentifier) {
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
                //console.log(response)
                var taskContent = "";
                
                if (response["name"])
                    taskContent += "<td>"+response["name"]+"</td>";
                else
                    taskContent += "<td></td>";
                
                if (response["type"])
                    taskContent += "<td>"+response["type"]+"</td>";
                else
                    taskContent += "<td></td>";
                
                if (response["dataset_name"])
                    taskContent += "<td>"+response["dataset_name"]+"</td>";
                else
                    taskContent += "<td></td>";
                
                if (response["nb_documents"])
                    taskContent += "<td>"+response["nb_documents"]+"</td>";
                else
                    taskContent += "<td>0</td>";
                
                if (response["nb_excerpts"])
                    taskContent += "<td>"+response["nb_excerpts"]+"</td>";
                else
                    taskContent += "<td>0</td>";
                
                if (response["nb_annotations"])
                    taskContent += "<td>"+response["nb_annotations"]+"</td>";
                else
                    taskContent += "<td>0</td>";
                
                if (response["status"])
                    taskContent += "<td>"+response["status"]+"</td>";
                else
                    taskContent += "<td>unknown</td>";
                
                if (response["assigned"])
                    taskContent += "<td>"+response["assigned"]+"</td>";
                else
                    taskContent += "<td></td>";

                if (response["assigned"]) {
                    color_assign = "grey";
                    if (response["assigned"] === userInfo["email"]) {
                        taskContent += "<td><a href=\"#\"><span id=\"self-assign-task-"+pos+
                            "\" style=\"color:orange;\"><i class=\"mdi mdi-minus\"/></span></a> &nbsp; " + 
                            "<a href=\"#\"><span id=\"annotate-task-"+pos+
                            "\" style=\"color:green;\"><i class=\"mdi mdi-border-color\"/></span></a></td>";
                    } else {
                        taskContent += "<td><a href=\"#\"><span id=\"self-assign-task-"+pos+
                            "\" style=\"color:grey;\"><i class=\"mdi mdi-minus\"/></span></a> &nbsp; " + 
                            "<a href=\"#\"><span id=\"annotate-task-"+pos+
                            "\" style=\"color:grey;\"><i class=\"mdi mdi-border-color\"/></span></a></td>";
                    }
                } else {
                    taskContent += "<td><a href=\"#\"><span id=\"self-assign-task-"+pos+
                    "\" style=\"color:green;\"><i class=\"mdi mdi-plus\"/></span></a> &nbsp; " + 
                    "<a href=\"#\"><span id=\"annotate-task-"+pos+
                    "\" style=\"color:grey;\"><i class=\"mdi mdi-border-color\"/></span></a></td>";
                }
                
                $("#task-"+pos).html(taskContent);

                if (response["assigned"]) {
                    if (response["assigned"] === userInfo["email"]) {
                        $("#self-assign-task-"+pos).click(function() {
                            selfUnassignTask(taskIdentifier);
                            return true;
                        });
                        $("#annotate-task-"+pos).click(function() {
                            //annotationTask(taskIdentifier, response["dataset_id"], response["type"], response["nb_excerpts"]);
                            annotationTask(response);
                            //clearMainContent();
                            return true;
                        });
                    } else {
                        $("#self-deassign-task-"+pos).click(function() {
                            unAssignTask(taskIdentifier);
                            return true;
                        });
                    }
                } else {
                    $("#self-assign-task-"+pos).click(function() {
                        selfAssignTask(taskIdentifier);
                        return true;
                    });
                }
            }
        };

        xhr.send(null);
    }

    function selfAssignTask(taskIdentifier) {
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
                var response = JSON.parse(xhr.responseText);
                console.log(response["detail"]);
                callToaster("toast-top-center", "error", response["detail"], "Damn, task self-assignment didn't work!");
            } else {
                callToaster("toast-top-center", "success", "Success!", "Self-assignment to task");
                displayTasks();
            }
        }

        xhr.send(null);
    }

    function selfUnassignTask(taskIdentifier) {
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
                callToaster("toast-top-center", "success", "Success!", "Self-unassignment from the task");
                displayTasks();
            }
        }

        xhr.send(null);
    }

    var classColorBootstrapMapping = { "blue": "primary", "grey": "default", "green" : "success", "orange": "warning", "red": "danger", "cyan": "info"};

    function annotationTask(taskInfo) {
        event.preventDefault();
        clearMainContent();
        $("#annotation-view").show();

        setTaskInfo(taskInfo);

        // get the list of excerpt identifiers for the tasks
        var url = defineBaseURL("tasks/"+taskInfo["id"]+"/excerpts");

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

        xhr.onloadend = function () {
            var response = JSON.parse(xhr.responseText);
            if (xhr.status != 200) {
                // display server level error
                console.log(response["detail"]);
                callToaster("toast-top-center", "error", response["detail"], "Damn, accessing excepts of the task failed!");
            } else if (xhr.status == 401) {
                window.location.href = "sign-in.html";
            } else {
                var excerpts = []
                for (var excerptPos in response["records"]["excerpts"]) {
                    excerpts.push(response["records"][excerptPos]);
                }
                taskInfo["excerpts"] = excerpts;
                taskInfo["first_non_complete"] = response["records"]["first_non_complete"];

                getTaskLabels(taskInfo);
            }
        }
        xhr.send(null);
    }

    function getTaskLabels(taskInfo) {
        // get labels for the dataset and task type, then launch the excerpt view
        var url = defineBaseURL("datasets/"+taskInfo["dataset_id"]+"/labels?type="+taskInfo["type"]);

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
                var labels = []
                for (var labelPos in response["records"]) {
                    labels.push(response["records"][labelPos])
                }
                setExcerptView(taskInfo, labels, taskInfo["first_non_complete"])
            }
        }
        xhr.send(null);
    }

    /**
      *  rank parameter is the index of the excerpt in the task
      **/
    function setExcerptView(taskInfo, labels, rank) {

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
            if (xhr.status != 200) {
                // display server level error
                console.log(response["detail"]);
                callToaster("toast-top-center", "error", response["detail"], "Damn, accessing task records didn't work!");
                $("#annotation-doc-view").html("<p>The task record is not available</p>");
            } else if (xhr.status == 401) {
                window.location.href = "sign-in.html";
            } else {
                response = response["record"];
                var fullContext = response["full_context"];
                var context = response["text"];
                var ind = fullContext.indexOf(context);

                if (ind != -1) {
                    var excerptText = "<span style=\"color: grey;\">" + he.encode(fullContext.substring(0, ind)) + "</span>" + 
                        he.encode(context) + 
                        "<span style=\"color: grey;\">" + he.encode(fullContext.substring(ind+context.length)) + "</span>";

                    $("#annotation-doc-view").html("<p>"+excerptText+"</p>");
                } else {
                    ("#annotation-doc-view").html("<p>"+he.encode(context)+"</p>");
                }

                // load a possible pre-annotation for the excerpt
                displayLabelArea(taskInfo, labels, rank, response["id"]);
            }
        }
        xhr.send(null);
    }

    function setTaskInfo(taskInfo) {
        var response = taskInfo;
        if (response == null) {
            $("#annotation-task-info").html("The task is not available");
        } else {
            //response = response["record"];
            var taskContent = "<table style=\"width:100%;\"><tr>";
        
            taskContent += "<td style=\"width:40%;font-size:150%;\"><span style=\"color:grey\">Progress:</span> "+
                "<span id=\"progress-done\">"+taskInfo["nb_completed_excerpts"]+"</span> / " + 
                response["nb_excerpts"] + " <span id=\"progress-complete\"></span> </td>"

            if (response["name"])
                taskContent += "<td style=\"width:15%;\"><span style=\"color:grey\">Task:</span> "+response["name"]+"</td>";

            if (response["type"])
                taskContent += "<td style=\"width:15%;\"><span style=\"color:grey\">Type:</span> "+response["type"]+"</td>";

            if (response["dataset_name"])
                taskContent += "<td style=\"width:15%;\"><span style=\"color:grey\">Dataset:</span> "+response["dataset_name"]+"</td>";

            if (response["nb_documents"])
                taskContent += "<td style=\"width:15%;\"><span style=\"color:grey\">Task doc.:</span> "+response["nb_documents"]+"</td>";

            taskContent += "</tr></table>\n";
            
            $("#annotation-task-info").html(taskContent);
        }
    }

    function displayLabelArea(taskInfo, labels, rank, excerptIdentifier) {    
        // get task info
        var url = defineBaseURL("annotations/excerpt/"+excerptIdentifier+"?type="+taskInfo["type"]);

        // retrieve the existing task information
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

        xhr.onloadend = function () {
            var prelabeling = {}
            var userAnnotation = false;
            var isIgnoredExcerpt = false;
            // status
            if (xhr.status == 200) {
                // store pre-labeling weights in the map 
                var response = JSON.parse(xhr.responseText);
                records = response["records"];
                for(var recordPos in records) {
                    let record = records[recordPos];

                    if (record["user_id"] == userInfo["id"]) {
                        userAnnotation = true;
                        if (record["ignored"]) {
                            isIgnoredExcerpt = true;
                        } else {
                            prelabeling[record["label_id"]] = record;
                        }
                    }

                    if (!prelabeling[record["label_id"]]) {
                        prelabeling[record["label_id"]] = record;
                    }
                }
            } 
            var labelHtmlContent = "";
            for(var labelPos in labels) {
                let label = labels[labelPos];
                
                if (prelabeling[label["id"]]) {
                    let prelabel = prelabeling[label["id"]];

                    console.log(prelabel);

                    labelHtmlContent += 
                            "<div class=\"w-100\" style=\"margin-top: auto; margin-bottom: auto;\">"+
                                "<label class=\"control control-checkbox checkbox-primary\" >"+label["name"];
                    if (prelabel["score"]) {
                        var numb = prelabel["score"].toFixed(2);
                        labelHtmlContent += " <span style=\"color:grey;\">("+numb+")</span>";
                    }

                    if (prelabel["value"] == 1) {
                        labelHtmlContent += "<input id=\"checkbox-"+label["name"]+"\" type=\"checkbox\" checked=\"checked\">";
                    } else {
                        labelHtmlContent += "<input id=\"checkbox-"+label["name"]+"\" type=\"checkbox\">";
                    }
                    labelHtmlContent += "<div class=\"control-indicator\"></div></label></div>";
                } else {
                    labelHtmlContent += 
                            "<div class=\"w-100\" style=\"margin-top: auto; margin-bottom: auto;\">"+
                                "<label class=\"control control-checkbox checkbox-primary\" >"+label["name"]+
                                "<input type=\"checkbox\">"+
                                "<div class=\"control-indicator\"></div>"+
                            "</label></div>";
                }
            }
            $("#annotation-val-area").html(labelHtmlContent);

            // validation/paging area
            pagingHtmlContent = "<button type=\"button\" id=\"button-start\" class=\"mb-1 btn btn-secondary\"><i class=\"mdi mdi-skip-backward\"/></button>";
            pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-back\" type=\"button\" class=\"mb-1 btn btn-secondary\"><i class=\"mdi mdi-less-than\"/></button>";
            pagingHtmlContent += " &nbsp; &nbsp; ";
            if (userAnnotation || isIgnoredExcerpt) {
                pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-validate\" type=\"button\" class=\"mb-1 btn \" style=\"background-color: #fec400;color:black;\">Update</button>";
                pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-ignore\" type=\"button\" class=\"mb-1 btn \" style=\"background-color: grey;color:white;\">Ignore</button>"; 
            } else {
                pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-validate\" type=\"button\" class=\"mb-1 btn \" style=\"background-color: #1e8449;color:white;\">Validate</button>";
                pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-ignore\" type=\"button\" class=\"mb-1 btn \" style=\"background-color: #7DBCFF;color:white;\">Ignore</button>"; 
            }
            pagingHtmlContent += " &nbsp; &nbsp; ";
            pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-next\" type=\"button\" class=\"mb-1 btn btn-secondary\"><i class=\"mdi mdi-greater-than\"/></button>";
            pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-end\" type=\"button\" class=\"mb-1 btn btn-secondary\"><i class=\"mdi mdi-skip-forward\"/></button>";
            $("#annotation-paging").html(pagingHtmlContent);

            if (rank == 0) {
                $("#button-start").css("visibility", "hidden");
                $("#button-back").css("visibility", "hidden");
            } else {
                $("#button-start").click(function() {
                    //clearMainContent();
                    setExcerptView(taskInfo, labels, 0);
                    return true;
                });
                $("#button-back").click(function() {
                    //clearMainContent();
                    setExcerptView(taskInfo, labels, rank-1);
                    return true;
                });
            }

            /*if (userAnnotation) {
                $("#button-validate").click(function() {
                    updateAnnotation(taskInfo, labels, rank, excerptIdentifier);
                    return true;
                });
            } else {*/
                $("#button-validate").click(function() {
                    validateAnnotation(taskInfo, labels, rank, excerptIdentifier, userAnnotation);
                    return true;
                });
            //}

            $("#button-ignore").click(function() {
                ignoreExcerpt(taskInfo, labels, rank, excerptIdentifier, userAnnotation);
                return true;
            });
            
            if (rank+1 == taskInfo["nb_excerpts"]) {
                $("#button-next").css("visibility", "hidden");
                $("#button-end").css("visibility", "hidden");
            } else {
                $("#button-next").click(function() {
                    //clearMainContent();
                    setExcerptView(taskInfo, labels, rank+1);
                    return true;
                });
                $("#button-end").click(function() {
                    //clearMainContent();
                    setExcerptView(taskInfo, labels, taskInfo["nb_excerpts"]-1);
                    return true;
                });
            }

        }
        xhr.send(null);
    }

    function validateAnnotation(taskInfo, labels, rank, excerptIdentifier, update) {
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
            var url = defineBaseURL("annotations/annotation");
            var data = {}
            data["label_id"] = key;
            data["value"] = classValueMap[key];
            data["excerpt_id"] = excerptIdentifier;
            data["task_id"] = taskInfo["id"];
            data["score"] = 1.0;
            data["source"] = "manual";
            const timeElapsed = Date.now();
            const date = new Date(timeElapsed);
            data["date"] = date.toISOString()
            data["type"] = taskInfo["type"];
            data["ignored"] = 0;

            // retrieve the existing task information
            var xhr = new XMLHttpRequest();
            xhr.open("PUT", url, true);
            xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

            xhr.onloadend = function () {
                if (xhr.status != 200) {
                    // display server level error
                    var response = JSON.parse(xhr.responseText);
                    console.log(response["detail"]);
                    callToaster("toast-top-center", "error", response["detail"], "Damn, adding annotation didn't work!");
                } else if (xhr.status == 401) {
                    window.location.href = "sign-in.html";
                } else {
                    // update progress info display
                    if (!update) {
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
                        $("#button-validate").css("background-color", "#fec400");
                        $("#button-validate").html("Update");
                        $("#button-validate").css("color", "black");
                    }

                    $("#button-validate").off('click');
                    $("#button-validate").click(function() {
                        validateAnnotation(taskInfo, labels, rank, excerptIdentifier, true);
                        return true;
                    });
                }
            }

            xhr.send(JSON.stringify(data));
        }
    }

    function ignoreExcerpt(taskInfo, labels, rank, excerptIdentifier) {
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
                if (xhr.status != 200) {
                    // display server level error
                    var response = JSON.parse(xhr.responseText);
                    console.log(response["detail"]);
                    callToaster("toast-top-center", "error", response["detail"], "Damn, ignoring excerpt didn't work!");
                } else if (xhr.status == 401) {
                    window.location.href = "sign-in.html";
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
                    $("#button-validate").css("background-color", "#fec400");
                    $("#button-validate").html("Update");
                    $("#button-validate").css("color", "black");

                    $("#button-validate").off('click');
                    $("#button-validate").click(function() {
                        validateAnnotation(taskInfo, labels, rank, excerptIdentifier, true);
                        return true;
                    });
                }
            }

            xhr.send(JSON.stringify(data));

    }

    function displayUsers() {
        $("#user-view").show();
        var url = defineBaseURL("users");

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
                callToaster("toast-top-center", "error", response["detail"], "Damn, accessing users didn't work!");
                $("#user-view-table").html("<tr><td>No Users available</td></tr>");
            } else {
                // otherwise go through the tasks
                var response = JSON.parse(xhr.responseText);
                if (response["records"].length == 0) {
                    $("#user-view-table").html("<tr><td>No Users available</td></tr>");
                } else {
                    var tableContent = 
                        "<thead><tr><td style=\"width:5%;\"></td>" + 
                        "<td style=\"width:30%;\">email</td><td style=\"width:10%;\">first name</td><td style=\"width:10%;\">" + 
                        "last name</td><td style=\"width:10%;\">role</td><td style=\"width:10%;\">action</td></tr></thead><tbody>";
                    for(var pos in response["records"]) {
                        tableContent += "<tr id=\"user-"+pos+"\"></tr>\n";
                    }
                    tableContent += "</tbody>";
                    $("#user-view-table").html(tableContent);
                    for(var pos in response["records"]) {
                        displayUser(pos, response["records"][pos]);
                    }
                }
            }
        };
        xhr.send(null);
    }

    function displayUser(pos, userIdentifier) {
        var url = defineBaseURL("users/"+userIdentifier);

        // retrieve the existing user information
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

        xhr.onloadend = function () {
            // status
            if (xhr.status != 200) {
                // display server level error
                var response = JSON.parse(xhr.responseText);
                console.log(response["detail"]);
                callToaster("toast-top-center", "error", response["detail"], "Damn, accessing users didn't work!");
            } else {
                // otherwise display the user information
                var response = JSON.parse(xhr.responseText);
                //console.log(response)
                var userContent = "<td><i class=\"mdi mdi-account-box\"></td><td>"+response["email"]+"</td>";
                if (response["first_name"])
                    userContent += "<td>"+response["first_name"]+"</td>";
                else
                    userContent += "<td></td>";
                if (response["first_name"])
                    userContent += "<td>"+response["last_name"]+"</td>";
                else
                    userContent += "<td></td>";
                userContent += "<td>"+response["role"]+"</td>";
                userContent += "<td><span style=\"color:orange;\"><i class=\"mdi mdi-account-edit\"/></span> &nbsp; " + 
                    "<a href=\"#\"><span id=\"delete-user-"+pos+"\" style=\"color:red;\"><i class=\"mdi mdi-delete\"/></span></a></td>";
                $("#user-"+pos).html(userContent);
                $("#delete-user-"+pos).click(function() {
                    deleteUser(userIdentifier);
                    //clearMainContent();
                    return true;
                });
                //console.log(userContent);
            }
        };

        // send the collected data as JSON
        xhr.send(null);
    }

    function deleteUser(userIdentifier) {
        event.preventDefault();
        var url = defineBaseURL("users/"+userIdentifier);

        // retrieve the existing task information
        var xhr = new XMLHttpRequest();
        xhr.open("DELETE", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

        xhr.onloadend = function () {
            // status
            if (xhr.status != 200 && xhr.status != 204) {
                // display server level error
                var response = JSON.parse(xhr.responseText);
                console.log(response["detail"]);
                callToaster("toast-top-center", "error", response["detail"], "Damn, deleting user didn't work!");
            } else {
                callToaster("toast-top-center", "success", "", "User has been deleted!");
            }
            displayUsers()
        };

        // send the collected data as JSON
        xhr.send(null);
    }

})(jQuery);
