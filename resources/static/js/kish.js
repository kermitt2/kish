/**
*  Javascript methods for the front end single page application.
*  This file should preferably be under a protected route, so that only logged users can access it. 
*
*  Author: Patrice Lopez
*/

var kish = (function($) {

    // current logged user information
    var userInfo = null;

    // clean view and startup
    clearMainContent();
    setAuthenticatedUserInfo();
    callToaster("toast-top-center", "success", "Welcome to KISH", "Yo!");

    $(document).ready(function() {
        $("#user-settings").hide();
        $('#user-settings-menu').click(function() {
            clearMainContent();
            activateMenuChoice($("#user-menu-home"));
            settings(userInfo);
            $("#user-settings").show();
        });

        $("#user-preferences").hide();
        $('#user-preferences-menu').click(function() {
            clearMainContent();
            activateMenuChoice($("#user-menu-home"));
            preferences(userInfo);
            $("#user-preferences").show();
        });

        $("#logout").click(function() {
            logout();
        });

        $('#update-settings-button').click(function() {
            event.preventDefault();
            updateSettings(userInfo);
        });

        $('#update-preferences-button').click(function() {
            event.preventDefault();
            updatePreferences(userInfo);
        });

        $("#tasks-home").click(function() {
            clearMainContent();
            activateMenuChoice($(this));
            displayTasks(userInfo);
        });

        $("#users-home").click(function() {
            clearMainContent();
            activateMenuChoice($(this));
            displayUsers();
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
            displayDatasets(userInfo);
        });

        $("#annotate-side-bar").click(function() {
            clearMainContent();
            activateMenuChoice($("#tasks-home"));
            activateSideBarMenuChoice($("#annotate-side-bar"));
            $("#guidelines-side-bar").show();
            $("#annotate-side-bar").show();
            $("#annotation-view").show();
            $("#annotation-doc-view").show();
            $("#annotation-val-area").show();
            $("#annotation-paging").show();
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
            displayDatasets(userInfo);
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
        });

        // prepare sidebar toggle
        $("#sidebar-toggler").trigger('click');
    });

    function setAuthenticatedUserInfo() {
        var url = defineBaseURL("users/me");

        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true); 
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onloadend = function () {
            // status
            if (xhr.status == 200 || xhr.status == 201) {
                userInfo = JSON.parse(xhr.responseText);
                //console.log(userInfo);
                updateUserSettings(userInfo);
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
        userInfo["redundant_tasks"] = [];

        xhr.onloadend = function () {
            // status
            if (xhr.status == 401) {
                window.location.href = "sign-in.html";
            } else if (xhr.status == 200) {
                var response = JSON.parse(xhr.responseText);
                var records = response["records"];

                userInfo["redundant_tasks"] = records;

                // get preferences information too, in background...
                setPreferencesUserInfo(userInfo);

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
})(jQuery);
