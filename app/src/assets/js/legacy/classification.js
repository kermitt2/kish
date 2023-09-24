/**
 * functions related to a classification task
 **/

function displayExcerptAreaClassification(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptItem) {
    // get inline tag annotations, if any
    var url = defineBaseURL("annotations/excerpt/"+excerptItem["id"]+"?type=labeling");

    // retrieve the existing annotation information
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
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
        if (xhr.status == 401) {
            window.location.href = "sign-in.html";
        } else if (xhr.status == 200) {
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
            context = applyInlineAnnotations(context, inlineLabeling, otherLabels, labelColorMap, ind);
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

function displayLabelAreaClassification(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptItem) {    
    // get task-specific annotations
    var url;

    if (taskInfo["type"] === "reconciliation") {
        // use original task type, this is an added field subtype, only available for reconciliation task
        // (see the data model)
        const primaryType = taskInfo["subtype"];
        url = defineBaseURL("annotations/excerpt/"+excerptItem["id"]+"?type="+primaryType);
    } else {
        url = defineBaseURL("annotations/excerpt/"+excerptItem["id"]+"?type="+taskInfo["type"]);
    } 

    // retrieve the existing annotation information
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open("GET", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    const localHeight = 40*labels.length;
    $("#annotation-val-area").css("min-height", localHeight);

    xhr.onloadend = function () {
        // general case for storing relevant label annotation
        var prelabeling = {}

        // for storing relevant label annotation in case of reconciliation task
        var prelabelingReconciliation = {}

        var isUserAnnotation = false;
        var isIgnoredExcerpt = false;

        if (excerptItem["ignored"]) {
            isIgnoredExcerpt = true;
        }

        if (excerptItem["validated"]) {
            isUserAnnotation = true;
        }

        // status
        if (xhr.status == 200) {
            var response = JSON.parse(xhr.responseText);
            records = response["records"];

            // store pre-labeling weights and user label in the map 
            for(var recordPos in records) {
                let record = records[recordPos];

                if (record["user_id"] == userInfo["id"] && record["task_id"] == taskInfo["id"]) {
                    //isUserAnnotation = true;
                    /*if (record["ignored"]) {
                        isIgnoredExcerpt = true;
                    } else {
                        prelabeling[record["label_id"]] = record;
                    }*/

                    if (!record["ignored"]) {
                        prelabeling[record["label_id"]] = record;
                    }
                }

                if (!prelabeling[record["label_id"]]) {
                    prelabeling[record["label_id"]] = record;
                }
            }

            if (!isUserAnnotation && taskInfo["type"] === "reconciliation") {
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

            if (!isUserAnnotation && taskInfo["type"] === "reconciliation") {
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

        var smallValView = false;    
        if (localWidth < 500) 
            smallValView = true;

        pagingHtmlContent += "<div class=\"row w-100 justify-content-center\">";
        if (!smallValView){
            pagingHtmlContent += "<button type=\"button\" id=\"button-start\" class=\"mb-1 btn btn-secondary\"><i class=\"mdi mdi-skip-backward\"/></button>";
            pagingHtmlContent += "<button id=\"button-back\" type=\"button\" class=\"mb-1 btn btn-secondary\" style=\"margin-left:10px; margin-right:20px;\"><i class=\"mdi mdi-less-than\"/></button>";
        } 
        if (isIgnoredExcerpt) {
            pagingHtmlContent += "<button id=\"button-validate\" type=\"button\" class=\"mb-1 btn update\">Update</button>";
            pagingHtmlContent += "<button id=\"button-ignore\" type=\"button\" class=\"mb-1 btn ignored\" style=\"margin-left: 10px;\">Ignored</button>"; 
        } else if (isUserAnnotation) {
            pagingHtmlContent += "<button id=\"button-validate\" type=\"button\" class=\"mb-1 btn update\">Update</button>";
            pagingHtmlContent += "<button id=\"button-ignore\" type=\"button\" class=\"mb-1 btn ignore-inactive\" style=\"margin-left: 10px;\">Ignore</button>"; 
        } else {
            pagingHtmlContent += "<button id=\"button-validate\" type=\"button\" class=\"mb-1 btn validate\">Validate</button>";
            pagingHtmlContent += "<button id=\"button-ignore\" type=\"button\" class=\"mb-1 btn ignore\" style=\"margin-left: 10px;\">Ignore</button>"; 
        }
        if (smallValView) {
            pagingHtmlContent += "</div>";
            pagingHtmlContent += "<div class=\"row w-100 justify-content-between \" style=\"width: 100%;\">";
            pagingHtmlContent += "<div>";
            pagingHtmlContent += "<button type=\"button\" id=\"button-start\" class=\"mb-1 btn btn-secondary\"><i class=\"mdi mdi-skip-backward\"/></button>";
            pagingHtmlContent += "<button id=\"button-back\" type=\"button\" class=\"mb-1 btn btn-secondary\" style=\"margin-left: 10px;\"><i class=\"mdi mdi-less-than\"/></button>";
            pagingHtmlContent += "</div>";
            pagingHtmlContent += "<div>";
            pagingHtmlContent += "<button id=\"button-next\" type=\"button\" class=\"mb-1 btn btn-secondary\"><i class=\"mdi mdi-greater-than\"/></button>";
            pagingHtmlContent += "<button id=\"button-end\" type=\"button\" class=\"mb-1 btn btn-secondary\" style=\"margin-left: 10px;\"><i class=\"mdi mdi-skip-forward\"/></button>";
            pagingHtmlContent += "</div>";
        } else {
            pagingHtmlContent += "<button id=\"button-next\" type=\"button\" class=\"mb-1 btn btn-secondary\" style=\"margin-left: 20px;\"><i class=\"mdi mdi-greater-than\"/></button>";
            pagingHtmlContent += "<button id=\"button-end\" type=\"button\" class=\"mb-1 btn btn-secondary\" style=\"margin-left: 10px;\"><i class=\"mdi mdi-skip-forward\"/></button>";
        }
        pagingHtmlContent += "</div>";
        $("#annotation-paging").html(pagingHtmlContent);

        if (rank == 0) {
            $("#button-start").css("visibility", "hidden");
            $("#button-back").css("visibility", "hidden");
        } else {
            $("#button-start").click(function() {
                setExcerptView(userInfo, taskInfo, labels, otherLabels, labelColorMap, 0);
            });
            $("#button-back").click(function() {
                setExcerptView(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank-1);
            });
        }

        $("#button-validate").click(function() {
            validateAnnotation(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptItem["id"], isUserAnnotation, null);
        });
        
        if (!isIgnoredExcerpt) {
            $("#button-ignore").click(function() {
                ignoreExcerpt(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptItem["id"], isUserAnnotation);
            });
        }
        
        if (rank+1 >= taskInfo["nb_excerpts"]) {
            $("#button-next").css("visibility", "hidden");
            $("#button-end").css("visibility", "hidden");
        } else {
            $("#button-next").click(function() {
                setExcerptView(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank+1);
            });
            $("#button-end").click(function() {
                setExcerptView(userInfo, taskInfo, labels, otherLabels, labelColorMap, taskInfo["nb_excerpts"]-1);
            });
        }
    }
    xhr.send(null);
}

function applyInlineAnnotations(context, inlineLabeling, otherLabels, labelColorMap, ind) {

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
        var startB = parseInt(b.offset_start, 10);
        return startA-startB; 
    });

    var pos = 0; // current position in the text
    var newString = ""
    for (var pi in pieces) {
        piece = pieces[pi];

        var start = parseInt(piece.offset_start, 10);
        var end = parseInt(piece.offset_end, 10);

        if (ind > 0) {
            start -= ind;
            end -= ind;
        }

        if (start < pos) {
            // we have a problem in the initial sort of the entities
            // the server response is not compatible with the present client 
            console.log("Sorting of inline entities as present in the server's response not valid for this client.");
            // note: this should never happen
        } else {
            newString += he.encode(context.substring(pos, start))
                + '<span class="label ' + piece['subtype'] + '" style="background-color:' + labelColorMap[piece["label_id"]] + '; color:white;" >'
                + he.encode(context.substring(start, end)) + '<span class="tooltiptext">'+piece['subtype']+'</span></span>';
            pos = end;
        }
    }
    newString += he.encode(context.substring(pos, context.length));
    return newString;
}
