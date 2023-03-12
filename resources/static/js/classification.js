/**
 * functions related to a classification task
 **/

function displayExcerptAreaClassification(userInfo, taskInfo, labels, otherLabels, rank, excerptItem) {
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

function displayLabelAreaClassification(userInfo, taskInfo, labels, otherLabels, rank, excerptIdentifier) {    
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

        //console.log(prelabeling);
        //console.log(prelabelingReconciliation);

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
                setExcerptView(userInfo, taskInfo, labels, otherLabels, 0);
                return true;
            });
            $("#button-back").click(function() {
                //clearMainContent();
                setExcerptView(userInfo, taskInfo, labels, otherLabels, rank-1);
                return true;
            });
        }

        $("#button-validate").click(function() {
            validateAnnotation(userInfo, taskInfo, labels, otherLabels, rank, excerptIdentifier, userAnnotation);
            return true;
        });
        
        if (!isIgnoredExcerpt) {
            $("#button-ignore").click(function() {
                ignoreExcerpt(userInfo, taskInfo, labels, otherLabels, rank, excerptIdentifier, userAnnotation);
                return true;
            });
        }
        
        if (rank+1 >= taskInfo["nb_excerpts"]) {
            $("#button-next").css("visibility", "hidden");
            $("#button-end").css("visibility", "hidden");
        } else {
            $("#button-next").click(function() {
                //clearMainContent();
                setExcerptView(userInfo, taskInfo, labels, otherLabels, rank+1);
                return true;
            });
            $("#button-end").click(function() {
                //clearMainContent();
                setExcerptView(userInfo, taskInfo, labels, otherLabels, taskInfo["nb_excerpts"]-1);
                return true;
            });
        }
    }
    xhr.send(null);
}
