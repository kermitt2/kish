/**
*  Basic javascript functions for managing the authentication pages.
*
*  Author: Patrice Lopez
*/

var base = (function($) {

    $(document).ready(function() {
        $('#sign-up-button').click(function() {
            event.preventDefault();
            signup();
        });

        $('#sign-in-button').click(function() {
            event.preventDefault();
            signin();
        });
    })

    function defineBaseURL(ext) {
        var baseUrl = null;
        var localBase = $(location).attr('href');
        if ( localBase.indexOf("/sign-up.html") != -1) {
             localBase = localBase.replace("/sign-up.html", "");
        } 
        if ( localBase.indexOf("/sign-in.html") != -1) {
             localBase = localBase.replace("/sign-in.html", "");
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
    
    function signin() {
        //var email = $("#username").val();
        var email = $("#email").val();
        var password = $("#password").val();

        if (validate_signin(email, password)) {
            // try to login the user
            var url = defineBaseURL("auth/jwt/login");

            // for some unknown reasons, FormData was not accepted by fastapi/pydantic
            var params = new Object();
            params['username'] = email;
            params['password'] = password;
            var urlEncodedData = "";
            for(var name in params) {
                urlEncodedData += encodeURIComponent(name)+'='+encodeURIComponent(params[name])+"&";
            }
            urlEncodedData = urlEncodedData.slice(0, -1);

            var xhr = new XMLHttpRequest();
            xhr.open("POST", url, true);
            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            xhr.setRequestHeader('accept', 'application/json');

            xhr.onloadend = function () {
                // status
                if (xhr.status != 200 && xhr.status != 201) {
                    // display server level error
                    var response = JSON.parse(xhr.responseText);
                    console.log(response["detail"]);
                    $('#div-submit').append("<div class=\"invalid-feedback\" style=\"color:red; display:inline;\">Error user sign-in: <br/>"+
                        response["detail"]+"</div>");
                } else {
                    console.log(xhr.responseText);
                    // cookie is set, start the application with a redirect
                    window.location.href = "index.html";
                }
            };

            xhr.send(urlEncodedData); 
        }
    }

    function signup() {
        // possible logout required?

        var email = $("#email").val();
        var forname = $("#forename").val();
        var lastname = $("#lastname").val();
        var password = $("#password").val();
        var cpassword = $("#cpassword").val();
        var termCheckbox = $('#term-checkbox').is(':checked');

        if (validate_signup(email, forname, lastname, password, cpassword, termCheckbox)) {
            // try to register the new user
            url = defineBaseURL("auth/register");
            var data = {};
            data["email"] = email;
            data["password"] = password;
            if (forname != null && forname.length > 0)
                data["first_name"] = forname;
            if (lastname != null && lastname.length > 0)
                data["last_name"] = lastname;
            data["role"] = "annotator"

            var xhr = new XMLHttpRequest();
            xhr.open("POST", url, true);
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
                    // cookie to be set
                    signin();
                }
            };

            // send the collected data as JSON
            xhr.send(JSON.stringify(data));
        }
    }

    function validate_signup(email, forname, lastname, password, cpassword, termCheckbox) {
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

        $("#password").removeClass("is-invalid");
        $("#password").removeClass("is-valid");
        if (password === "") {
            $("#password").addClass("is-invalid");
            $("#div-password").append("<div class=\"invalid-feedback\">Please enter a password</div>");
            validation = false;
        } else if (password.length < 8) {
            $("#password").addClass("is-invalid");
            $("#div-password").append("<div class=\"invalid-feedback\">Password must have at least 8 characters</div>");
            validation = false;
        } else {
            $("#password").addClass("is-valid");
        }

        $("#cpassword").removeClass("is-invalid");
        $("#cpassword").removeClass("is-valid");
        if (cpassword === "") {
            $("#cpassword").addClass("is-invalid");
            $("#div-cpassword").append("<div class=\"invalid-feedback\">Please enter a confirmation password</div>");
            validation = false;
        } else if (cpassword.length < 8) {
            $("#cpassword").addClass("is-invalid");
            $("#div-cpassword").append("<div class=\"invalid-feedback\">Password must have at least 8 characters</div>");
            validation = false;
        } else if (password.length >= 8 && password !== cpassword) {
            $("#password").addClass("is-invalid");
            $("#cpassword").addClass("is-invalid");
            $("#div-cpassword").append("<div class=\"invalid-feedback\">Password and confirmation password do not match</div>");
            validation = false;
        } else {
            $("#cpassword").addClass("is-valid");
        }

        if (!termCheckbox) {
            $("#div-checkbox").append("<div class=\"invalid-feedback\" style=\"display: inline;\">&nbsp;You need to agree</div>");
            console.log("add invalid feedback");
            validation = false;
        }

        return validation;
    }

    function validate_signin(email, password, cpassword) {
        var validation = true;

        const feedback = document.querySelectorAll('.invalid-feedback');
        feedback.forEach(feedb => {
            feedb.remove();
        });

        $("#email").removeClass("is-invalid");
        $("#email").removeClass("is-valid");
        if (email === "") {
            $("#email").addClass("is-invalid");
            $("#div-username").append("<div class=\"invalid-feedback\">Please enter an email</div>");
            validation = false;
        } else if (email.indexOf("@") == -1) {
            $("#email").addClass("is-invalid");
            $("#div-username").append("<div class=\"invalid-feedback\">It does not look like an email</div>");
            validation = false;
        } else {
            $("#email").addClass("is-valid");
        }

        $("#password").removeClass("is-invalid");
        $("#password").removeClass("is-valid");
        if (password === "") {
            $("#password").addClass("is-invalid");
            $("#div-password").append("<div class=\"invalid-feedback\">Please enter a password</div>");
            validation = false;
        } else if (password.length < 8) {
            $("#password").addClass("is-invalid");
            $("#div-password").append("<div class=\"invalid-feedback\">Password must have at least 8 characters</div>");
            validation = false;
        } else {
            $("#password").addClass("is-valid");
        }

        return validation;
    }   

    function logout() {
        var url = defineBaseURL("auth/jwt/logout");

        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true); 
        
        xhr.onloadend = function () {
            // status
            if (xhr.status == 200) {
                userInfo = JSON.parse(xhr.responseText);
                console.log(userInfo);
            } else if (xhr.status == 401) {
                // it is fine and expected, no user logged
            }
        };
        xhr.send(null);
    }

})(jQuery);
