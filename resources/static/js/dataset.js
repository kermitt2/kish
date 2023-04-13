/** 
 * The functions to manage datasets
 */ 

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
    var url = defineBaseURL("datasets/"+dataset_id+"/metrics");
    
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

function displayDatasetCreation() {
    $("#dataset-create-view").show();
    $("#dataset-create-view").html("Dataset creation - Work in progress");
}

var datasetHeaderTemplate = "<table class=\"table table-borderless\"><tr><td><img src=\"{{image_url}}\" width=\"50\" height=\"50\"/></td> \
                <td style=\"text-align: top; max-width: 400px\"><p><span style=\"color:white; font-weight: bold;\">{{name}}</span></p> \
                <p>{{description}}</p></td><td><p>&nbsp;</p></td> \
                <td style=\"text-align: top;\"><p>&nbsp;</p><p>{{nb_documents}} documents </p></td> \
                <td style=\"text-align: top;\"><p>&nbsp;</p><p>{{nb_excerpts}} excertps </p></td> \
                <td style=\"text-align: top;\"><p>&nbsp;</p><p>{{nb_tasks}} tasks </p></td>";

function displayDatasets(userInfo) {
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
                $("#dataset-view").html(divContent).promise().done(function() {
                    for(var pos in response["records"]) {
                        displayDataset(userInfo, pos, response["records"][pos]);
                    }
                });
            }
        }
    };

    xhr.send(null);
}
    
function displayDataset(userInfo, pos, datasetIdentifier) {
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
                "<span class=\"clickable\" id=\"delete-dataset-"+pos+"\" style=\"color:red;\"><i class=\"mdi mdi-delete\"/></span></td>";
            } else {
                divContent += "<td></td>";
            }                
            divContent += "</tr></table>";

            $("#dataset-"+pos).html(divContent).promise().done(function() {
                $("#delete-dataset-"+pos).click(function() {
                    deleteDataset(datasetIdentifier);
                });

                displayDatasetTasks(userInfo, pos, datasetIdentifier);
            });
        }
    };

    // send the collected data as JSON
    xhr.send(null);
}

function displayDatasetTasks(userInfo, pos, datasetIdentifier) {
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
                $("#dataset-"+pos+"-task-view-table").html(tableContent).promise().done(function() {
                    for(var pos2 in response["records"]) {
                        displayTaskItem(userInfo, "dataset-"+pos, pos2, response["records"][pos2]);
                    }
                });
            }
        }
    };

    xhr.send(null);
}
