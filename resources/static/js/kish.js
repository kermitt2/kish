/**
*  Javascript methods for the front end single page application.
*  This file should preferably be under a protected route, so that only logged users can access it. 
*
*  Author: Patrice Lopez
*/

var kish = (function($) {

    // current logged user information
    var userInfo = null;

    // clean view
    clearMainContent();
    
    setAuthenticatedUserInfo();
    callToaster("toast-top-center", "success", "Welcome to KISH", "Yo!");

    $(document).ready(function() {
        $("#user-settings").hide();
        $('#user-settings-menu').click(function() {
            clearMainContent();
            activateMenuChoice($("#user-menu-home"));
            settings();
            $("#user-settings").show();
            return true;
        });

        $("#user-preferences").hide();
        $('#user-preferences-menu').click(function() {
            clearMainContent();
            activateMenuChoice($("#user-menu-home"));
            preferences();
            $("#user-preferences").show();
            return true;
        });

        $("#logout").click(function() {
            logout();
            return true;
        });

        $('#update-settings-button').click(function() {
            event.preventDefault();
            updateSettings();
        });

        $('#update-preferences-button').click(function() {
            event.preventDefault();
            updatePreferences();
        });

        $("#tasks-home").click(function() {
            clearMainContent();
            activateMenuChoice($(this));
            displayTasks();
            return true;
        });

        $("#users-home").click(function() {
            clearMainContent();
            activateMenuChoice($(this));
            displayUsers();
            return true;
        });

        $("#datasets-home").click(function() {
            clearMainContent();
            activateMenuChoice($(this));
            activateSideBarMenuChoice($("#dataset-tasks-side-bar"));
            $("#dataset-tasks-side-bar").show();
            if (userInfo["role"] === "admin" || userInfo["role"] === "curator") {
                $("#dataset-metrics-side-bar").show();
            }
            if (userInfo["role"] === "admin") {
                $("#dataset-create-side-bar").show();
                $("#dataset-export-side-bar").show();
            }
            displayDatasets();
            return true;
        });

        $("#annotate-side-bar").click(function() {
            clearMainContent();
            activateMenuChoice($("#tasks-home"));
            activateSideBarMenuChoice($("#annotate-side-bar"));
            $("#guidelines-side-bar").show();
            $("#annotate-side-bar").show();
            $("#annotation-view").show();
            return true;
        });

        $("#guidelines-side-bar").click(function() {
            clearMainContent();
            activateMenuChoice($("#tasks-home"));
            activateSideBarMenuChoice($("#guidelines-side-bar"));
            var taskIdentifier = $("#guidelines-task-id").text();
            showGuidelines(taskIdentifier);
            $("#guidelines-side-bar").show();
            $("#annotate-side-bar").show();
            $("#guidelines-view").show();
            return true;
        });

        $("#dataset-tasks-side-bar").click(function() {
            clearMainContent();
            activateMenuChoice($("#datasets-home"));
            activateSideBarMenuChoice($("#dataset-tasks-side-bar"));
            $("#dataset-tasks-side-bar").show();
            if (userInfo["role"] === "curator" || userInfo["role"] === "admin") {
                $("#dataset-metrics-side-bar").show();
            }
            if (userInfo["role"] === "admin") {
                $("#dataset-create-side-bar").show();
                $("#dataset-export-side-bar").show();
            }
            displayDatasets();
            return true;
        });

        $("#dataset-create-side-bar").click(function() {
            clearMainContent();
            activateMenuChoice($("#datasets-home"));
            activateSideBarMenuChoice($("#dataset-create-side-bar"));
            $("#dataset-tasks-side-bar").show();
            if (userInfo["role"] === "curator" || userInfo["role"] === "admin") {
                $("#dataset-metrics-side-bar").show();
            }
            if (userInfo["role"] === "admin") {
                $("#dataset-create-side-bar").show();
                $("#dataset-export-side-bar").show();
                displayDatasetCreation();
            }
            return true;
        });

        $("#dataset-metrics-side-bar").click(function() {
            clearMainContent();
            activateMenuChoice($("#datasets-home"));
            activateSideBarMenuChoice($("#dataset-metrics-side-bar"));
            $("#dataset-tasks-side-bar").show();
            if (userInfo["role"] === "curator" || userInfo["role"] === "admin") {
                $("#dataset-metrics-side-bar").show();
                displayDatasetsMetrics();
            }
            if (userInfo["role"] === "admin") {
                $("#dataset-create-side-bar").show();
                $("#dataset-export-side-bar").show();
            }
            return true;
        });

        $("#dataset-export-side-bar").click(function() {
            clearMainContent();
            activateMenuChoice($("#datasets-home"));
            activateSideBarMenuChoice($("#dataset-export-side-bar"));
            $("#dataset-tasks-side-bar").show();
            if (userInfo["role"] === "curator" || userInfo["role"] === "admin") {
                $("#dataset-metrics-side-bar").show();
            }
            if (userInfo["role"] === "admin") {
                $("#dataset-create-side-bar").show();
                $("#dataset-export-side-bar").show();
                displayDatasetExport();
            }            
            return true;
        });

        // prepare sidebar toggle
        $("#sidebar-toggler").trigger('click');
    });

    function activateMenuChoice(element) {
        $("#tasks-home").find('span').css("color", "");
        $("#tasks-home").removeClass("active");
        $("#users-home").find('span').css("color", "");
        $("#users-home").removeClass("active");
        $("#datasets-home").find('span').css("color", "");
        $("#datasets-home").removeClass("active");
        $("#user-menu-home").find('span').css("color", "");
        $("#user-menu-home").removeClass("active");
        element.find('span').css("color", "#7DBCFF");
        element.addClass("active");
    }

    function activateSideBarMenuChoice(element) {
        $("#dataset-tasks-side-bar").find('span').css("color", "");
        $("#dataset-tasks-side-bar").removeClass("active");
        $("#dataset-create-side-bar").find('span').css("color", "");
        $("#dataset-create-side-bar").removeClass("active");
        $("#dataset-metrics-side-bar").find('span').css("color", "");
        $("#dataset-metrics-side-bar").removeClass("active");
        $("#dataset-export-side-bar").find('span').css("color", "");
        $("#dataset-export-side-bar").removeClass("active");
        $("#annotate-side-bar").find('span').css("color", "");
        $("#annotate-side-bar").removeClass("active");
        $("#guidelines-side-bar").find('span').css("color", "");
        $("#guidelines-side-bar").removeClass("active");
        element.find('span').css("color", "#7DBCFF");
        element.addClass("active");
    }

    function clearMainContent() {
        $("#user-settings").hide();
        $("#user-preferences").hide();
        $("#my-task-view").hide();
        $("#user-view").hide();
        $("#dataset-view").hide();
        $("#annotation-view").hide();
        $("#guidelines-view").hide();
        $("#annotate-side-bar").hide();
        $("#guidelines-side-bar").hide();
        $("#dataset-tasks-side-bar").hide();
        $("#dataset-create-side-bar").hide();
        $("#dataset-metrics-side-bar").hide();
        $("#dataset-export-side-bar").hide();
        $("#dataset-create-view").hide();
        $("#dataset-metrics-view").hide();
        $("#dataset-export-view").hide();
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
            if (xhr.status == 200 || xhr.status == 201) {
                userInfo = JSON.parse(xhr.responseText);                
                updateUserSettings();
                //console.log(userInfo);
                if (userInfo["role"] == "admin") {
                    $("#users-home").show();
                }
                initTaskState();
            } else {
                // not authorized, redirect to login page (note it should not happen 
                // as the page would be served under a protected route)
                window.location.href = "sign-in.html";
            }
        };

        xhr.send(null);
    }

    function initTaskState() {
        // store information about primary and redundant tasks, to avoid further server calls
        var url = defineBaseURL("tasks/redundant/me");

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true); 
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        // default
        userInfo["redundant_tasks"] = []

        xhr.onloadend = function () {
            // status
            if (xhr.status == 401) {
                window.location.href = "sign-in.html";
            } else if (xhr.status == 200) {
                var response = JSON.parse(xhr.responseText);
                var records = response["records"];

                userInfo["redundant_tasks"] = records;

                // get preferences information too, in background...
                setPreferencesUserInfo();

                // once login done and user tasks ready, activate My Tasks 
                $("#tasks-home").trigger('click');
            } else {
                // something's wrong !
                var response = JSON.parse(xhr.responseText);
                console.log(response["detail"]);
                $('#div-submit').append("<div class=\"invalid-feedback\" style=\"color:red; display:inline;\">Error user login: <br/>"+
                    response["detail"]+"</div>");
                callToaster("toast-top-center", "error", response["detail"], "Didn't work!");
            }
        };

        xhr.send(null);
    }

    function setPreferencesUserInfo() {
        var url = defineBaseURL("users/preferences");

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true); 
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onloadend = function () {
            // status
            if (xhr.status == 200 || xhr.status == 201) {
                var preferencesInfo = JSON.parse(xhr.responseText);
                preferencesInfo = preferencesInfo["record"];
                if (preferencesInfo["auto_move_on"])
                    userInfo["auto_move_on"] = preferencesInfo["auto_move_on"];
                else 
                     userInfo["auto_move_on"] = 0;
                if (preferencesInfo["dark_mode"])
                    userInfo["dark_mode"] = preferencesInfo["dark_mode"];
                else
                    userInfo["dark_mode"] = 0;
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

    function preferences() {
        var autoMoveOn = 1;
        var darkMode = 1;
        if (userInfo["auto_move_on"] == 0)
            autoMoveOn = userInfo["auto_move_on"];
        if (userInfo["dark_mode"] == 0)
            darkMode = userInfo["dark_mode"];

        if (autoMoveOn == 1) 
            $("#preferences-move-on").prop('checked', true);
        else 
            $("#preferences-move-on").prop('checked', false);
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
    
    function updateSettings() {
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

    function updatePreferences() {
        var autoMoveOn;
        if ($("#preferences-move-on").is(":checked")) {
            autoMoveOn = 1;
        } else {
            autoMoveOn = 0;
        }
        userInfo["auto_move_on"] = autoMoveOn;

        // update on server
        var url = defineBaseURL("users/preferences");
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

        var data = {}
        data["auto_move_on"] = autoMoveOn

        xhr.onloadend = function () {
            // status
            if (xhr.status != 200 && xhr.status != 201) {
                // display server level error
                var response = JSON.parse(xhr.responseText);
                console.log(response["detail"]);
                $('#div-submit-preferences').append("<div class=\"invalid-feedback\" style=\"color:red; display:inline;\">Error preferences update: <br/>"+
                    response["detail"]+"</div>");
                callToaster("toast-top-center", "error", response["detail"], "Didn't work!");
            } else {
                // otherwise update is done, update local user settings and notify the change
                callToaster("toast-top-center", "success", "Your preferences are updated", "Yes!");
            }
        };

        // send the collected data as JSON
        xhr.send(JSON.stringify(data));
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
            if (xhr.status == 401) {
                // unauthorized, move to login screen
                window.location.href = "sign-in.html";
            } else if (xhr.status != 200) {
                // display server level error
                var response = JSON.parse(xhr.responseText);
                console.log(response["detail"]);
                callToaster("toast-top-center", "error", response["detail"], "Damn, accessing datasets didn't work!");
                $("#dataset-view").html("<p>No dataset available</p>");
            } else {
                // otherwise go through the datasets
                var response = JSON.parse(xhr.responseText);
                if (response["records"].length == 0) {
                    $("#dataset-view").html("<p>No dataset available</p>");
                } else {
                    var divContent = ""
                    for(var pos in response["records"]) {
                        divContent += "<div class=\"row border\"><span id=\"dataset-"+pos+"\"></span>";
                        divContent += "<div stype=\"border-bottom: 1px solid #8a909d; width: 100%; height: 2px;\">&nbsp;</div>";
                        // table for the tasks of the dataset
                        divContent += "<table id=\"dataset-"+pos+"-task-view-table\" class=\"table table-borderless\" style=\"width:90%;table-layout:fixed;border-top: 1px solid #8a909d;\"></table>";
                        divContent += "</div>";
                    }
                    $("#dataset-view").html(divContent);

                    for(var pos in response["records"]) {
                        displayDataset(pos, response["records"][pos]);
                        displayDatasetTasks(pos, response["records"][pos]);
                    }
                }
            }
        };

        xhr.send(null);
    }

    var datasetHeaderTemplate = "<table class=\"table table-borderless\"><tr><td><img src=\"{{image_url}}\" width=\"50\" height=\"50\"/></td> \
                <td style=\"text-align: top; max-width: 400px\"><p><span style=\"color:white; font-weight: bold;\">{{name}}</span></p> \
                <p>{{description}}</p></td><td><p>&nbsp;</p></td> \
                <td style=\"text-align: top;\"><p>&nbsp;</p><p>{{nb_documents}} documents </p></td> \
                <td style=\"text-align: top;\"><p>&nbsp;</p><p>{{nb_excerpts}} excertps </p></td> \
                <td style=\"text-align: top;\"><p>&nbsp;</p><p>{{nb_tasks}} tasks </p></td>";

    function displayDataset(pos, datasetIdentifier) {
        var url = defineBaseURL("datasets/"+datasetIdentifier);

        // retrieve the existing task information
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
                callToaster("toast-top-center", "error", response["detail"], "Damn, accessing datasets didn't work!");
            } else {
                // otherwise display the dataset information
                var response = JSON.parse(xhr.responseText);
                response = response["record"]
                var divContent = datasetHeaderTemplate
                                .replace("{{image_url}}", response["image_url"])
                                .replace("{{name}}", response["name"])
                                .replace("{{description}}", response["description"])
                                .replace("{{nb_documents}}", response["nb_documents"])
                                .replace("{{nb_excerpts}}", response["nb_excerpts"])
                                .replace("{{nb_tasks}}", response["nb_tasks"]);

                if (userInfo["is_superuser"]) {
                    divContent += "<td style=\"text-align: top;\"><p>&nbsp;</p><span style=\"color:orange;\"><i class=\"mdi mdi-database-edit\"/></span> &nbsp; " + 
                    "<a href=\"#\"><span id=\"delete-dataset-"+pos+"\" style=\"color:red;\"><i class=\"mdi mdi-delete\"/></span></a></td>";
                } else {
                    divContent += "<td></td>";
                }                
                divContent += "</tr></table>";

                $("#dataset-"+pos).html(divContent);
                $("#delete-dataset-"+pos).click(function() {
                    deleteDataset(datasetIdentifier);
                    //clearMainContent();
                    return true;
                });
            }
        };

        // send the collected data as JSON
        xhr.send(null);
    }

    function displayDatasetTasks(pos, datasetIdentifier) {
        // retrieve all the existing task information for a given dataset
        var url = defineBaseURL("tasks/dataset/"+datasetIdentifier);

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

        xhr.onloadend = function () {
            // status
            if (xhr.status == 401) {
                window.location.href = "sign-in.html";
            } else if (xhr.status != 200) {
                // display server level error
                var response = JSON.parse(xhr.responseText);
                console.log(response["detail"]);
                callToaster("toast-top-center", "error", response["detail"], "Damn, accessing tasks didn't work!");
                ("#dataset-"+pos+"-task-view-table").html("<tr><td>No tasks available</td></tr>");
            } else {
                // otherwise go through the tasks
                var response = JSON.parse(xhr.responseText);
                if (response["records"].length == 0) {
                    $("#dataset-"+pos+"-task-view-table").html("<tr><td>No tasks available</td></tr>");
                } else {

                    var tableContent = templateTaskTableHeader;
                    tableContent = tableContent.replace("{{first_col_width}}", "3");
                    tableContent = tableContent.replace("{{status}}", "");
                    for(var pos2 in response["records"]) {
                        tableContent += "<tr id=\"dataset-"+pos+"-task-"+pos2+"\"></tr>\n";
                    }
                    tableContent += "</tbody>";
                    $("#dataset-"+pos+"-task-view-table").html(tableContent);
                    for(var pos2 in response["records"]) {
                        displayTask("dataset-"+pos, pos2, response["records"][pos2]);
                    }
                }
            }
        };

        xhr.send(null);
    }

    function displayDatasetCreation() {
        $("#dataset-create-view").show();
        $("#dataset-create-view").html("Dataset creation - Work in progress");
    }

    function displayDatasetsMetrics() {
        //display metrics for every available datasets
        $("#dataset-metrics-view").show();
        var url = defineBaseURL("datasets");

        // retrieve the existing task information
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
                callToaster("toast-top-center", "error", response["detail"], "Damn, accessing datasets didn't work!");
                $("#dataset-metrics-view").html("<p>No dataset available</p>");
            } else {
                // otherwise go through the datasets
                var response = JSON.parse(xhr.responseText);
                if (response["records"].length == 0) {
                    $("#dataset-metrics-view").html("<p>No dataset available</p>");
                } else {
                    var divContent = ""
                    for(var pos in response["records"]) {
                        divContent += "<div class=\"row border\"><span id=\"dataset-metrics-"+pos+"\"></span>";
                        divContent += "</div>";
                    }

                    $("#dataset-metrics-view").html(divContent);
                    for(var pos in response["records"]) {
                        displayDatasetMetrics(pos, response["records"][pos]);
                    }
                }
            }
        };

        xhr.send(null);

    }

    function displayDatasetMetrics(pos, dataset_id) {
        // display the metrics for one given dataset
        var url = defineBaseURL("datasets/"+dataset_id+"/metrics?type=classification");
        
        // retrieve dataset metrics
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
                callToaster("toast-top-center", "error", response["detail"], "Damn, accessing dataset metrics didn't work!");
                $("#dataset-metrics-"+pos).html("metrics not available");
            } else {
                var response = JSON.parse(xhr.responseText);
                if (response["metrics"]) {
                    response = response["metrics"];
                    var divContent = datasetHeaderTemplate
                                .replace("{{image_url}}", response["image_url"])
                                .replace("{{name}}", response["name"])
                                .replace("{{description}}", response["description"])
                                .replace("{{nb_documents}}", response["nb_documents"])
                                .replace("{{nb_excerpts}}", response["nb_excerpts"])
                                .replace("{{nb_tasks}}", response["nb_tasks"]);
                    divContent += "</tr></table><div class=\"row pb-2\">";

                    divContent += "<div class=\"col\"><h2 class=\"mb-1\">" + 
                                    (response["progress"] * 100).toFixed(2) + "&nbsp;%</h2><p style=\"color:#8a909d;\">progress</p></div>";

                                    //response["nb_completed_cases"] + " total completed excerpt cases"
                                    //response["nb_total_cases"] + " total excerpt cases"

                    divContent += "<div class=\"col\"><h2 class=\"mb-1\">" + 
                                    (response["percentage_agreement"] * 100).toFixed(2) + "&nbsp;%</h2><p style=\"color:#8a909d;\">percentage agreement</p></div>";

                    divContent += "</div>";

                    $("#dataset-metrics-"+pos).html(divContent);
                } else {
                    $("#dataset-metrics-"+pos).html("metrics not available");
                }
            }

        }

        xhr.send(null);
    }

    function displayDatasetExport() {
        $("#dataset-export-view").show();
        $("#dataset-export-view").html("Dataset export - Work in progress");
    }

    function displayTasks() {
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
                        displayTask("active", pos, response["records"][pos]["task_id"]);
                    }
                }
            }
        };

        xhr.send(null);
    }

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

    function displayTask(table, pos, taskIdentifier) {
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
                            selfUnassignTask(taskIdentifier);
                            return true;
                        });
                        $("#annotate" + origin + "-task-"+pos).click(function() {
                            annotationTask(response);
                            return true;
                        });
                    } else {
                        $("#self-deassign" + origin + "-task-"+pos).click(function() {
                            unAssignTask(taskIdentifier);
                            return true;
                        });
                    }
                } else {
                    if (userInfo["redundant_tasks"].indexOf(taskIdentifier) == -1 || 
                        (response["type"] === "reconciliation" && userInfo["role"] !== "annotator")) {
                        $("#self-assign" + origin + "-task-"+pos).click(function() {
                            selfAssignTask(taskIdentifier);
                            return true;
                        });
                    } 
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
                    displayTasks();
                else
                    displayDatasets();
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
                    displayTasks();
                else                
                    displayDatasets();
            }
        }

        xhr.send(null);
    }

    function annotationTask(taskInfo) {
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

                getTaskLabels(taskInfo);
            }
        }
        xhr.send(null);
    }

    function getTaskLabels(taskInfo) {
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
                setExcerptView(taskInfo, labels, otherLabels, taskInfo["first_non_complete"]);
            }
        }
        xhr.send(null);
    }

    /**
      *  rank parameter is the index of the excerpt in the task
      **/
    function setExcerptView(taskInfo, labels, otherLabels, rank) {

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

                displayExcerptArea(taskInfo, labels, otherLabels, rank, response);
                displayLabelArea(taskInfo, labels, otherLabels, rank, response["id"]); 
            }
        }
        xhr.send(null);
    }

    function displayExcerptArea(taskInfo, labels, otherLabels, rank, excerptItem) {
        // get inline tag annotations, if any
        var url = defineBaseURL("annotations/excerpt/"+excerptItem["id"]+"?type=labeling");

        // retrieve the existing annotation information
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

        // only relevant for classification: we can display in the excerpt inline tags
        var inlineLabels = null;
        if (taskInfo["type"] === "classification" || taskInfo["type"] === "reconciliation") {
            inlineLabels = [];
            for(var labelPos in otherLabels) {
                const localLabel = otherLabels[labelPos];
                if (localLabel["type"] == "labeling") {
                    inlineLabels.push(localLabel["id"]);
                }
            }
        } 

        xhr.onloadend = function () {
            // list of inline annotations in case of classification excerpt to be visually enriched
            var inlineLabeling = [];
            // status
            if (xhr.status == 200) {
                var response = JSON.parse(xhr.responseText);
                records = response["records"];
                for(var recordPos in records) {
                    let record = records[recordPos];
                    const localLabelId = record["label_id"];
                    if (inlineLabels != null && inlineLabels.indexOf(localLabelId) != -1) {
                        inlineLabeling.push(record);
                    }
                }
            }

            // now display the possibly enriched excerpt
            var docInfoText = "<div class=\"pb-2\"><p>Task excerpt " + (rank+1) + " / " + taskInfo["nb_excerpts"] + " - " + "<span id=\"doc_url\"></span></p></div>"

            var fullContext = excerptItem["full_context"];
            var context = excerptItem["text"];
            var ind = fullContext.indexOf(context);

            if (inlineLabeling != null && inlineLabeling.length > 0) {
                context = applyInlineAnnotations(context, inlineLabeling, otherLabels);
            } else {
                context = he.encode(context);
            }

            if (ind != -1) {
                var excerptText = "<span style=\"color: grey;\">" + he.encode(fullContext.substring(0, ind)) + "</span>" + 
                    context + 
                    "<span style=\"color: grey;\">" + he.encode(fullContext.substring(ind+context.length)) + "</span>";

                $("#annotation-doc-view").html(docInfoText + "<p>"+excerptText+"</p>");
            } else {
                ("#annotation-doc-view").html(docInfoText + "<p>"+context+"</p>");
            }

            setDocumentInfo(excerptItem["document_id"]);
        }

        xhr.send(null);
    }

    function applyInlineAnnotations(context, inlineLabeling, otherLabels) {

        if (inlineLabeling == null || inlineLabeling.length == 0) 
            return context;

        // return the text with inline annotation markups, properly encoded
        var pieces = [];

        var otherLabelMap = {};
        for(var labelPos in otherLabels) {
            otherLabelMap[otherLabels[labelPos]["id"]] = otherLabels[labelPos]["name"];
        }

        var subTypeSeen = [];
        for (var labelingPos in inlineLabeling) {
            var annotation = inlineLabeling[labelingPos];
            var labelName = otherLabelMap[annotation["label_id"]];

            if (subTypeSeen.indexOf(labelName) != -1)
                break;
            else
                subTypeSeen.push(labelName);

            annotation['subtype'] = labelName;
            pieces.push(annotation);
        }

        pieces.sort(function(a, b) { 
            var startA = parseInt(a.offset_start, 10);
            //var endA = parseInt(a.offsetEnd, 10);

            var startB = parseInt(b.offset_start, 10);
            //var endB = parseInt(b.offsetEnd, 10);

            return startA-startB; 
        });

        var pos = 0; // current position in the text
        var newString = ""
        for (var pi in pieces) {
            piece = pieces[pi];

            //var entityRawForm = piece.rawForm;
            var start = parseInt(piece.offset_start, 10);
            var end = parseInt(piece.offset_end, 10);

            if (start < pos) {
                // we have a problem in the initial sort of the entities
                // the server response is not compatible with the present client 
                console.log("Sorting of inline entities as present in the server's response not valid for this client.");
                // note: this should never happen
            } else {
                newString += he.encode(context.substring(pos, start))
                    //+ '<span id="annot-' + currentEntityIndex + '" rel="popover" data-color="' + piece['subtype'] + '">'
                    //+ '<span id="annot-' + currentEntityIndex + '-' + pi + '">'
                    //+ '<span class="label ' + piece['subtype'] + '" style="cursor:hand;cursor:pointer;" >'
                    + '<span class="label ' + piece['subtype'] + '" style="" >'
                    + he.encode(context.substring(start, end)) + '<span class="tooltiptext">'+piece['subtype']+'</span></span>';
                pos = end;
            }
        }
        newString += he.encode(context.substring(pos, context.length));
        return newString;
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

    const taskInfoTemplate = "<table style=\"width:100%;\"><tr> \
                            <td style=\"width:40%;font-size:150%;\"><span style=\"color:grey\">Progress:</span> \
                            <span id=\"progress-done\">{{nb_completed_excerpts}}</span> / \
                             {{nb_excerpts}} <span id=\"progress-complete\"></span> </td> \
                            <td style=\"width:15%;\"><span style=\"color:grey\">Task:</span> {{name}} </td> \
                            <td style=\"width:15%;\"><span style=\"color:grey\">Type:</span> {{type}} </td> \
                            <td style=\"width:15%;\"><span style=\"color:grey\">Dataset:</span> {{dataset_name}} </td> \
                            <td style=\"width:15%;\"><span style=\"color:grey\">Task doc.:</span> {{nb_documents}} </td> \
                            </tr></table>";

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

    function displayLabelArea(taskInfo, labels, otherLabels, rank, excerptIdentifier) {    
        // get task-specific annotations
        var url;

        if (taskInfo["type"] === "reconciliation") {
            // use original task type, this is an added field subtype, only available for reconciliation task
            // (see the data model)
            const primaryType = taskInfo["subtype"];
            url = defineBaseURL("annotations/excerpt/"+excerptIdentifier+"?type="+primaryType);
        } else {
            url = defineBaseURL("annotations/excerpt/"+excerptIdentifier+"?type="+taskInfo["type"]);
        } 

        // retrieve the existing annotation information
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

        const localHeight = 40*labels.length;
        $("#annotation-val-area").css("min-height", localHeight);

        xhr.onloadend = function () {
            // general case for storing relevant label annotation
            var prelabeling = {}

            // for storing relevant label annotation in case of reconciliation task
            var prelabelingReconciliation = {}

            var userAnnotation = false;
            var isIgnoredExcerpt = false;

            // status
            if (xhr.status == 200) {
                var response = JSON.parse(xhr.responseText);
                records = response["records"];

                // store pre-labeling weights and user label in the map 
                for(var recordPos in records) {
                    let record = records[recordPos];

                    if (record["user_id"] == userInfo["id"] && record["task_id"] == taskInfo["id"]) {
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

                if (!userAnnotation && taskInfo["type"] === "reconciliation") {
                    // case reconciliation to be performed
                    for(var recordPos in records) {
                        let record = records[recordPos];

                        // we need to store all annotations from other users/task
                        if (record["user_id"] != null && record["task_id"] != taskInfo["id"]) {

                            if (!prelabelingReconciliation[record["label_id"]]) {
                                prelabelingReconciliation[record["label_id"]] = []
                            }
                            prelabelingReconciliation[record["label_id"]].push(record);
                        }
                    }
                }
            } 

            console.log(prelabeling);
            console.log(prelabelingReconciliation);

            var labelHtmlContent = "";
            for(var labelPos in labels) {
                let label = labels[labelPos];

                if (!userAnnotation && taskInfo["type"] === "reconciliation") {
                    var disagreement = false;
                    var values = [];
                    if (prelabelingReconciliation[label["id"]]) {
                        // do we have a disagreement for this label ? 
                        var localRecords = prelabelingReconciliation[label["id"]];
                        
                        for(var localRecordPos in localRecords) {
                            var localRecord = localRecords[localRecordPos];
                            const localVal = localRecord["value"];
                            if (values.length > 0 && !values.includes(localVal)) {
                                // disgreement for the label
                                disagreement = true;
                            } 

                            values.push(localVal);
                        }
                    }

                    if (disagreement) {
                        labelHtmlContent += 
                            "<div class=\"w-100\" style=\"margin-top: auto; margin-bottom: auto;\">"+
                                "<label class=\"control control-checkbox checkbox-danger\" style=\"color:#fe5461;\">"+label["name"];

                            labelHtmlContent += " <span style=\"color:grey;\">(disagreement ";
                            for (var valuePos in values) {
                                if (valuePos != 0) 
                                    labelHtmlContent += " / ";
                                if (values[valuePos] == 0)
                                    labelHtmlContent += "false";
                                else if (values[valuePos] == 1)
                                    labelHtmlContent += "true";
                                else  
                                    labelHtmlContent += values[valuePos];
                            }
                            labelHtmlContent +=  ")</span>";
                            labelHtmlContent += "<input id=\"checkbox-"+label["name"]+"\" type=\"checkbox\">";

                    } else {
                        labelHtmlContent += 
                            "<div class=\"w-100\" style=\"margin-top: auto; margin-bottom: auto;\">"+
                                "<label class=\"control control-checkbox checkbox-primary\" >"+label["name"];

                        if (prelabelingReconciliation[label["id"]] && prelabelingReconciliation[label["id"]].length > 0) {
                            let prelabel = prelabelingReconciliation[label["id"]][0];
                            if (prelabel["value"] == 1) {
                                labelHtmlContent += "<input id=\"checkbox-"+label["name"]+"\" type=\"checkbox\" checked=\"checked\">";
                            } else {
                                labelHtmlContent += "<input id=\"checkbox-"+label["name"]+"\" type=\"checkbox\">";
                            }
                        } else {
                            let prelabel = prelabeling[label["id"]];
                            if (prelabel["value"] == 1) {
                                labelHtmlContent += "<input id=\"checkbox-"+label["name"]+"\" type=\"checkbox\" checked=\"checked\">";
                            } else {
                                labelHtmlContent += "<input id=\"checkbox-"+label["name"]+"\" type=\"checkbox\">";
                            }
                        }
                    }

                    labelHtmlContent += "<div class=\"control-indicator\"></div></label></div>";

                } else if (prelabeling[label["id"]]) {
                    let prelabel = prelabeling[label["id"]];
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
            var localWidth = $("#annotation-val-view").width();
            var pagingHtmlContent = "";
            if (localWidth < 500) {
                // we will need to place the navigation buttons under the valid/ignore buttons
                pagingHtmlContent += "<div class=\"row w-100 justify-content-center \" style=\"width: 100%;\">";
                if (isIgnoredExcerpt) {
                    pagingHtmlContent += " <button id=\"button-validate\" type=\"button\" class=\"mb-1 btn btn-secondary\">Update</button>";
                    pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-ignore\" type=\"button\" class=\"mb-1 btn \" style=\"background-color: red;color:white;\">Ignored</button>"; 
                } else if (userAnnotation) {
                    pagingHtmlContent += "  <button id=\"button-validate\" type=\"button\" class=\"mb-1 btn \" style=\"background-color: #fec400;color:black;\">Update</button>";
                    pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-ignore\" type=\"button\" class=\"mb-1 btn btn-secondary\" style=\"color:white;\">Ignore</button>"; 
                } else {
                    pagingHtmlContent += " <button id=\"button-validate\" type=\"button\" class=\"mb-1 btn \" style=\"background-color: #1e8449;color:white;\">Validate</button>";
                    pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-ignore\" type=\"button\" class=\"mb-1 btn \" style=\"background-color: #7DBCFF;color:white;\">Ignore</button>"; 
                }
                pagingHtmlContent += "</div>";

                pagingHtmlContent += "<div class=\"row w-100 justify-content-between \"  style=\"width: 100%;\">";
                pagingHtmlContent += "<div>";
                pagingHtmlContent += "<button type=\"button\" id=\"button-start\" class=\"mb-1 btn btn-secondary\"><i class=\"mdi mdi-skip-backward\"/></button>";
                pagingHtmlContent += " &nbsp; <button id=\"button-back\" type=\"button\" class=\"mb-1 btn btn-secondary\"><i class=\"mdi mdi-less-than\"/></button>";
                pagingHtmlContent += "</div>";
                pagingHtmlContent += "<div>";
                pagingHtmlContent += " <button id=\"button-next\" type=\"button\" class=\"mb-1 btn btn-secondary\"><i class=\"mdi mdi-greater-than\"/></button>";
                pagingHtmlContent += " &nbsp; <button id=\"button-end\" type=\"button\" class=\"mb-1 btn btn-secondary\"><i class=\"mdi mdi-skip-forward\"/></button>";
                pagingHtmlContent += "</div>";
                pagingHtmlContent += "</div>";
            } else {
                pagingHtmlContent += "<button type=\"button\" id=\"button-start\" class=\"mb-1 btn btn-secondary\"><i class=\"mdi mdi-skip-backward\"/></button>";
                pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-back\" type=\"button\" class=\"mb-1 btn btn-secondary\"><i class=\"mdi mdi-less-than\"/></button>";
                pagingHtmlContent += " &nbsp; &nbsp; ";
                if (isIgnoredExcerpt) {
                    pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-validate\" type=\"button\" class=\"mb-1 btn btn-secondary\">Update</button>";
                    pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-ignore\" type=\"button\" class=\"mb-1 btn \" style=\"background-color: red;color:white;\">Ignored</button>"; 
                } else if (userAnnotation) {
                    pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-validate\" type=\"button\" class=\"mb-1 btn \" style=\"background-color: #fec400;color:black;\">Update</button>";
                    pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-ignore\" type=\"button\" class=\"mb-1 btn btn-secondary\" style=\"color:white;\">Ignore</button>"; 
                } else {
                    pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-validate\" type=\"button\" class=\"mb-1 btn \" style=\"background-color: #1e8449;color:white;\">Validate</button>";
                    pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-ignore\" type=\"button\" class=\"mb-1 btn \" style=\"background-color: #7DBCFF;color:white;\">Ignore</button>"; 
                }
                pagingHtmlContent += " &nbsp; &nbsp; ";
                pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-next\" type=\"button\" class=\"mb-1 btn btn-secondary\"><i class=\"mdi mdi-greater-than\"/></button>";
                pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-end\" type=\"button\" class=\"mb-1 btn btn-secondary\"><i class=\"mdi mdi-skip-forward\"/></button>";
            }
            $("#annotation-paging").html(pagingHtmlContent);

            if (rank == 0) {
                $("#button-start").css("visibility", "hidden");
                $("#button-back").css("visibility", "hidden");
            } else {
                $("#button-start").click(function() {
                    //clearMainContent();
                    setExcerptView(taskInfo, labels, otherLabels, 0);
                    return true;
                });
                $("#button-back").click(function() {
                    //clearMainContent();
                    setExcerptView(taskInfo, labels, otherLabels, rank-1);
                    return true;
                });
            }

            $("#button-validate").click(function() {
                validateAnnotation(taskInfo, labels, otherLabels, rank, excerptIdentifier, userAnnotation);
                return true;
            });
            
            if (!isIgnoredExcerpt) {
                $("#button-ignore").click(function() {
                    ignoreExcerpt(taskInfo, labels, otherLabels, rank, excerptIdentifier, userAnnotation);
                    return true;
                });
            }
            
            if (rank+1 >= taskInfo["nb_excerpts"]) {
                $("#button-next").css("visibility", "hidden");
                $("#button-end").css("visibility", "hidden");
            } else {
                $("#button-next").click(function() {
                    //clearMainContent();
                    setExcerptView(taskInfo, labels, otherLabels, rank+1);
                    return true;
                });
                $("#button-end").click(function() {
                    //clearMainContent();
                    setExcerptView(taskInfo, labels, otherLabels, taskInfo["nb_excerpts"]-1);
                    return true;
                });
            }
        }
        xhr.send(null);
    }

    function validateAnnotation(taskInfo, labels, otherLabels, rank, excerptIdentifier, update) {
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
            validateAnnotation(taskInfo, labels, otherLabels, rank, excerptIdentifier, true);
            return true;
        });
        $("#button-ignore").off('click');
        $("#button-ignore").click(function() {
            ignoreExcerpt(taskInfo, labels, otherLabels, rank, excerptIdentifier);
            return true;
        });

        // if auto move on is set, we move automatically to the next excerpt item of the task, except if we are at the end
        if (userInfo["auto_move_on"] == 1 && completed == 0 && ((rank+1) != taskInfo["nb_excerpts"])) {
            setExcerptView(taskInfo, labels, otherLabels, rank+1);
        }

        // update task assignment information to keep track of the progress more easily
        updateTaskAssignment(taskInfo["id"], completed, currentCount);
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
        data["type"] = taskInfo["type"];
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

    function ignoreExcerpt(taskInfo, labels, otherLabels, rank, excerptIdentifier) {
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
                    validateAnnotation(taskInfo, labels, otherLabels, rank, excerptIdentifier, true);
                    return true;
                });
            }
        }

        xhr.send(JSON.stringify(data));
    }

    const userRowTemplate = "<td><i class=\"mdi mdi-account-box\"></td><td>{{email}}</td> \
                <td id=\"first-name-user-{{pos}}\">{{first_name}}</td> \
                <td id=\"last-name-user-{{pos}}\">{{last_name}}</td> \
                <td id=\"password-user-{{pos}}\"><a href=\"#\">********</a></td> \
                <td><select class=\"form-control\" id=\"role-{{pos}}\" style=\"background-color:#0d1117; color:#8a909d; border:0; padding-left:0;width: auto;\"> \
                <option>annotator</option><option>curator</option><option>admin</option> \
                </select></td> \
                <td><a href=\"#\"><span id=\"update-user-{{pos}}\" style=\"color:{{color_edit}};\"><i class=\"mdi mdi-account-edit\"/></span> &nbsp; \
                <a href=\"#\"><span id=\"delete-user-{{pos}}\" style=\"color:{{color_delete}};\"><i class=\"mdi mdi-delete\"/></span></a></td>";

    const userHeaderRow = "<thead><tr><td style=\"width:5%;\"></td> \
                        <td style=\"width:30%;\">email</td><td style=\"width:10%;\">first name</td><td style=\"width:10%;\"> \
                        last name</td><td style=\"width:10%;\">password</td><td style=\"width:10%;\">role</td> \
                        <td style=\"width:10%;\">action</td></tr></thead>";

    const addNewUserRow = "<tr><td><a href=\"#\"><span id=\"add-new-user\" style=\"color:green;\"><i class=\"mdi mdi-plus\"/></span></a></td>"+
                          "<td>Add new user</td><td></td><td></td><td></td><td></td><td></td></tr>";

    function displayUsers() {
        $("#user-view").show();
        var url = defineBaseURL("users");

        // retrieve the existing task information
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

        xhr.onloadend = function () {
            // status
            if (xhr.status == 401) {
                window.location.href = "sign-in.html";
            } else if (xhr.status != 200) {
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
                    
                    var tableContent = userHeaderRow + "<tbody>";
                    for(var pos in response["records"]) {
                        tableContent += "<tr id=\"user-"+pos+"\"></tr>";
                    }
                    tableContent += addNewUserRow;
                    tableContent += "</tbody>";
                    $("#user-view-table").html(tableContent);
                    for(var pos in response["records"]) {
                        displayUser(pos, response["records"][pos]);
                    }

                    $("#add-new-user").click(function() {
                        event.preventDefault();
                        const newLocation = $(this).parent().parent().parent();
                        addNewUser(newLocation);                        

                        return true;
                    });
                }
            }
        };
        xhr.send(null);
    }

    function addNewUser(newLocation) {
        // get the position of the new user
        var pos = $("#user-view-table tr").length - 2;
        var addRow = userRowTemplate
            .replaceAll("{{pos}}", pos)
            .replace("{{email}}", "<span id=\"email-user-"+pos+"\" style=\"font-style: italic;\"> email </span>")
            .replace("{{first_name}}", "")
            .replace("{{last_name}}", "")
            .replace(">annotator", " selected>annotator")
            .replace("{{color_edit}}", "grey")
            .replace("{{color_delete}}", "red");

        newLocation.attr("id", "user-"+pos);
        newLocation.html(addRow);
        newLocation.parent().append(addNewUserRow);

        // new user mini form is a bit different from the normal one because we need minimal values
        $("#delete-user-"+pos).click(function() {
            // we simply delete the row locally
            var rowToDelete = $(this).parent().parent().parent();
            rowToDelete.remove();

            // re-activate new user button
            $("#add-new-user").click(function() {
                event.preventDefault();
                const newLocation = $(this).parent().parent().parent();
                addNewUser(newLocation);                        

                return true;
            });
            return true;
        });

        $("#email-user-"+pos).click(function() {
            event.preventDefault();
            var addField = "<input id=\"email-input-"+pos+"\" type=\"text\" style=\"width: 100%;\"></input>";
            $(this).html(addField);
            $("#update-user-"+pos).css("color", "orange");
            $("#update-user-"+pos).addClass("active");
            $("#email-user-"+pos).off('click');
            return true;
        });

        $("#password-user-"+pos).click(function() {
            event.preventDefault();
            var addField = "<input id=\"password-input-"+pos+"\" type=\"text\" style=\"width: 100%;\"></input>";
            $(this).html(addField);
            $("#update-user-"+pos).css("color", "orange");
            $("#update-user-"+pos).addClass("active");
            $("#password-user-"+pos).off('click');
            return true;
        });

        $("#first-name-user-"+pos).click(function() {
            event.preventDefault();
            var addField = "<input id=\"first-name-input-"+pos+"\" type=\"text\" style=\"width: 100%;\" value=\""+$(this).text()+"\"></input>";
            $(this).html(addField);
            $("#update-user-"+pos).css("color", "orange");
            $("#update-user-"+pos).addClass("active");
            $("#first-name-user-"+pos).off('click');
            return true;
        });

        $("#last-name-user-"+pos).click(function() {
            event.preventDefault();
            var addField = "<input id=\"last-name-input-"+pos+"\" type=\"text\" style=\"width: 100%;\"  value=\""+$(this).text()+"\"></input>";
            $(this).html(addField);
            $("#update-user-"+pos).css("color", "orange");
            $("#update-user-"+pos).addClass("active");
            $("#last-name-user-"+pos).off('click');
            return true;
        });

        $("#update-user-"+pos).click(function() {
            //event.preventDefault();
            if ($(this).hasClass("active")) {
                updateUser(null, pos);
            }
            return true;
        });
    }


    function displayUser(pos, userIdentifier) {
        var url = defineBaseURL("users/"+userIdentifier);

        // retrieve the existing user information
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

        xhr.onloadend = function () {
            // status
            if (xhr.status == 401) {
                window.location.href = "sign-in.html";
            } else if (xhr.status != 200) {
                // display server level error
                var response = JSON.parse(xhr.responseText);
                console.log(response["detail"]);
                callToaster("toast-top-center", "error", response["detail"], "Damn, accessing users didn't work!");
            } else {
                // otherwise display the user information
                var response = JSON.parse(xhr.responseText);

                var addRow = userRowTemplate
                            .replaceAll("{{pos}}", pos)
                            .replace("{{email}}", response["email"])                            
                            .replace(">annotator", " selected>annotator")
                            .replace(">"+response["role"], " selected>"+response["role"])
                            .replace("{{color_edit}}", "grey")
                            .replace("{{color_delete}}", "red");

                if (response["first_name"])
                    addRow = addRow.replace("{{first_name}}", response["first_name"]);
                else
                    addRow = addRow.replace("{{first_name}}", "");
    
                if (response["last_name"])
                    addRow = addRow.replace("{{last_name}}", response["last_name"]);
                else
                    addRow = addRow.replace("{{last_name}}", "");

                $("#user-"+pos).html(addRow);
                $("#delete-user-"+pos).click(function() {
                    deleteUser(userIdentifier);
                    return true;
                });

                $("#role-"+pos).change(function() {
                    event.preventDefault();
                    $("#update-user-"+pos).css("color", "orange");
                    $("#update-user-"+pos).addClass("active");
                    return true;
                });

                $("#password-user-"+pos).click(function() {
                    event.preventDefault();
                    var addField = "<input id=\"password-input-"+pos+"\" type=\"text\" style=\"width: 100%;\"></input>";
                    $(this).html(addField);
                    $("#update-user-"+pos).css("color", "orange");
                    $("#update-user-"+pos).addClass("active");
                    $("#password-user-"+pos).off('click');
                    return true;
                });

                $("#first-name-user-"+pos).click(function() {
                    event.preventDefault();
                    var addField = "<input id=\"first-name-input-"+pos+"\" type=\"text\" style=\"width: 100%;\" value=\""+$(this).text()+"\"></input>";
                    $(this).html(addField);
                    $("#update-user-"+pos).css("color", "orange");
                    $("#update-user-"+pos).addClass("active");
                    $("#first-name-user-"+pos).off('click');
                    return true;
                });

                $("#last-name-user-"+pos).click(function() {
                    event.preventDefault();
                    var addField = "<input id=\"last-name-input-"+pos+"\" type=\"text\" style=\"width: 100%;\"  value=\""+$(this).text()+"\"></input>";
                    $(this).html(addField);
                    $("#update-user-"+pos).css("color", "orange");
                    $("#update-user-"+pos).addClass("active");
                    $("#last-name-user-"+pos).off('click');
                    return true;
                });

                $("#update-user-"+pos).click(function() {
                    //event.preventDefault();
                    if ($(this).hasClass("active")) {
                        updateUser(userIdentifier, pos);
                    }
                    return true;
                });
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
            if (xhr.status == 401) {
                window.location.href = "sign-in.html";
            } else if (xhr.status != 200 && xhr.status != 204) {
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

    function updateUser(userIdentifier, pos) {
        event.preventDefault();

        var newUser = false;
        if (userIdentifier == null)
            newUser = true;

        var email;
        if (newUser) {
            // email
            email = $("#email-input-"+pos).val();
        }

        // role 
        const role = $("#role-"+pos+" option:selected").val();

        // first name 
        const firstName = $("#first-name-input-"+pos).val();

        // first name 
        const lastName = $("#last-name-input-"+pos).val();

        // password 
        const password = $("#password-input-"+pos).val();

        var data = {};
        data["role"] = role;
        if (newUser && email && email.length > 0)
            data["email"] = email;
        if (firstName && firstName.length > 0)
            data["first_name"] = firstName;
        if (lastName && lastName.length > 0)
            data["last_name"] = lastName;
        if (password && password.length > 0)
            data["password"] = password;

        // retrieve the existing task information
        var xhr = new XMLHttpRequest();

        var url = null;
        if (newUser) {
            // it's like registering
            url = defineBaseURL("auth/register");
            xhr.open("POST", url, true);
        } else {
            url = defineBaseURL("users/"+userIdentifier);
            xhr.open("PATCH", url, true);
        }
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

        xhr.onloadend = function () {
            // status
            if (xhr.status == 401) {
                window.location.href = "sign-in.html";
            } else if (xhr.status != 200 && xhr.status != 201 && xhr.status != 204) {
                // display server level error
                var response = JSON.parse(xhr.responseText);
                console.log(response["detail"]);

                var erroMsg;
                if (newUser)
                    erroMsg = "Damn, creating user didn't work!";
                else 
                    erroMsg = "Damn, updating user didn't work!";

                callToaster("toast-top-center", "error", response["detail"], erroMsg);
                if (!newUser) 
                    displayUsers();
            } else {
                var successMsg;
                if (newUser)
                    successMsg = "User has been created!";
                else
                    successMsg = "User has been updated!";

                callToaster("toast-top-center", "success", "", successMsg);
                displayUsers();
            }
        };

        // send the collected data as JSON
        xhr.send(JSON.stringify(data));
    }

    function showGuidelines(taskIdentifier) {
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
    }

})(jQuery);
