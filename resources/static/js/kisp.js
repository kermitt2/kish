/**
*  Javascript functions for the front end single page application.
*
*  Author: Patrice Lopez
*/

var kisp = (function($) {

    var userInfo = null;

    setAuthenticatedUserInfo();

    $(document).ready(function() {
        $("#user-settings").hide();
        $('#user-settings-menu').click(function() {
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
    });

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
                console.log(userInfo);
                $('#display-name-header').html(userInfo["email"]);
                document.querySelector("body").style.visibility = "visible";
                var nameSpace = "";
                if (userInfo["first_name"]) 
                    nameSpace += userInfo["first_name"] + " ";
                if (userInfo["last_name"]) 
                    nameSpace += userInfo["last_name"] + " ";
                nameSpace += "<small class=\"pt-1\">" + userInfo["email"] + "</small>";
                $('#display-name').html(nameSpace);
            } else {
                // not authorized, redirect to login page (note it should not happen 
                // as the page would be served under a protected route)
                window.location.href = "sign-in.html";
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
            data["password"] = password;

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
                } else {
                    // otherwise update is done, update local user settings and notify the change
                    
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
            $("#div-oldPassword").append("<div class=\"invalid-feedback\">Please enter your old password</div>");
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
        if (password === "") {
            $("#newPassword").addClass("is-invalid");
            $("#div-newPassword").append("<div class=\"invalid-feedback\">Please enter a new password</div>");
            validation = false;
        } else if (password.length < 8) {
            $("#newPassword").addClass("is-invalid");
            $("#div-newPassword").append("<div class=\"invalid-feedback\">Password must have at least 8 characters</div>");
            validation = false;
        } else {
            $("#newPassword").addClass("is-valid");
        }

        $("#conPassword").removeClass("is-invalid");
        $("#conPassword").removeClass("is-valid");
        if (cpassword === "") {
            $("#conPassword").addClass("is-invalid");
            $("#div-conPassword").append("<div class=\"invalid-feedback\">Please enter a confirmation password</div>");
            validation = false;
        } else if (cpassword.length < 8) {
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

})(jQuery);
