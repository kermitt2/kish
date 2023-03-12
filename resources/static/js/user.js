/** 
 * The functions to manage users and user settings
 */ 

// templates
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
            console.log(response);
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

function setPreferencesUserInfo(userInfo) {
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

function settings(userInfo) {
    $("#email").val(userInfo["email"]);
    //$("#email").addclass(readonly);
    $("#firstName").val(userInfo["first_name"]);
    $("#lastName").val(userInfo["last_name"]);
}

function updateUserSettings(userInfo) {
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
   
function updateSettings(userInfo) {
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
                updateUserSettings(userInfo);
                callToaster("toast-top-center", "success", "Your profile is updated", "Yes!");
            }
        };

        // send the collected data as JSON
        xhr.send(JSON.stringify(data));
    }
}

function preferences(userInfo) {
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

function updatePreferences(userInfo) {
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
