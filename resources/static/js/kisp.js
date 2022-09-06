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
                console.log(response)
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
                        "<thead><tr><td style=\"width:10%;\"></td>" + 
                        "<td style=\"width:10%;\">Task</td><td style=\"width:10%;\">For Dataset</td>"+
                        "<td style=\"width:10%;\"># documents</td><td style=\"width:10%;\"># excerpts</td>"+
                        "<td style=\"width:10%;\">Status</td>"+
                        "<td style=\"width:20%;\">Action</td></tr></thead><tbody>";
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
                console.log(response)
                var taskContent = "<td></td>";
                if (response["name"])
                    taskContent += "<td>"+response["name"]+"</td>";
                else
                    taskContent += "<td></td>";
                if (response["dataset-id"])
                    taskContent += "<td>"+response["dataset-id"]+"</td>";
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
                taskContent += "<td><span id=\"self-assign-task-"+pos+"\" style=\"color:green;\"><i class=\"mdi mdi-plus\"/></span> &nbsp; " + 
                    "<a href=\"#\"><span id=\"self-assign-task-"+pos+
                    "\" style=\"color:orange;\"><i class=\"mdi mdi-account-edit\"/></span></a></td>";
                $("#task-"+pos).html(taskContent);
                $("#self-assign-task-"+pos).click(function() {
                    selfAssignTask(taskIdentifier);
                    //clearMainContent();
                    return true;
                });
                console.log(taskContent);
            }
        };

        // send the collected data as JSON
        xhr.send(null);
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
                console.log(response)
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
                console.log(userContent);
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
