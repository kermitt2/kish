/**
 * General functions for menu/layout actions
 **/

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
    $("#annotation-doc-view").html("");
    $("#annotation-val-area").html("");
    $("#annotation-paging").html("");
}
