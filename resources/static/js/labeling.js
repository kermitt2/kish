/**
 * functions related to a field labeling task
 **/

var recognito;
var recognito_mode;

var docInfoTemplate = "<div class=\"pb-2\"><div class=\"row\" style=\"display: flex; align-items: center;\">" + 
            "<div class=\"col\" style=\"display: flex; align-items: center;\"><p>{{level}} excerpt {{rank}} / {{totalRank}} - " + 
            "<span id=\"doc_url\"></span></p></div>" + 
            "<div class=\"col-md-auto\"><button class=\"sb-1 btn-sm btn-relation\" id=\"button_relation\">" + 
            "Relation</button></div></div></div>";

/**
 * Label editor plugin
 **/
var LabelSelectorWidget = function(args) {

    // get task label infos
    var labels = args.labels ? args.labels : [];
    var currentAnnotation = args.annotation;

    var activateLabel = function(evt) { 
        //console.log(evt)
        if (evt.target.classList.contains('disabled')) {
            // do nothing, alternatively we could remove previous selection, annotation and set the new one to this
        } else if (evt.target.classList.contains('selected')) {
            // if label already selected without annotation, just deselect
            evt.target.classList.remove("selected");

            if (currentAnnotation && currentAnnotation.bodies && currentAnnotation.bodies.length>0 && currentAnnotation.bodies[0].value === evt.target.textContent) {
                //console.log(currentAnnotation.id);
                args.onRemoveBody(currentAnnotation.bodies[0]);
            }

            for (var ind in labels) {
                $("#button_"+ind).removeClass("disabled");
            }
        } else {
            // other label was selected and will be replace by the present label
            // remove annotation corresponding to previous selected
            args.onAppendBody({
                type: 'TextualBody',
                purpose: 'tagging',
                value: evt.target.textContent
            });
            evt.target.classList.add("selected");
        }
    }

    var createButton = function(label, ind) {
        var button = document.createElement('span');
        button.className = 'btn-sm btn';
        button.setAttribute('id', 'button_'+ind);
        button.setAttribute('type', 'button');
        button.textContent = label["name"];
        if (label["color"]) {
            button.style.backgroundColor = label["color"];
        } else {
            button.style.backgroundColor = getRandomDarkColor();
        }
        button.style.color = "white";
        button.addEventListener('click', activateLabel); 
        return button;
    }

    var container = document.createElement('div');
    container.className = 'r6o-widget';

    for (var labelPos in labels) {
        var button = createButton(labels[labelPos], labelPos);
        button.style["margin-right"] = "5px";
        button.style["margin-top"] = "5px";           

        if (currentAnnotation && currentAnnotation.bodies && currentAnnotation.bodies.length>0 && 
            currentAnnotation.bodies[0].value === labels[labelPos]["name"]) {
            button.classList.add("selected");
        } else if (currentAnnotation && currentAnnotation.bodies && currentAnnotation.bodies.length>0) {
            button.classList.add("disabled");
        }

        container.appendChild(button);
    }

    recognito.setMode('ANNOTATION');
    recognito_mode = 'ANNOTATION';
    document.body.style.cursor = "default";

    return container;
}

function displayDocumentAreaLabeling(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank) {
    // get document information
    urlString = "tasks/"+taskInfo["id"]+"/document"
    if (rank != null)
        urlString += "?rank="+rank;  
    var url = defineBaseURL(urlString);

    // retrieve the existing task item information
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
            if (response["doi"])
                docText += response["doi"];
            $("#doc_url").html(docText);

            // todo jump to the last non-validated excerpt?
            var rankExcerpt = 0;

            $("#previousDocumentButton").off('click');
            $("#nextDocumentButton").off('click');

            $("#button-document-validation").off('click');
            $("#button-document-update").off('click');
            $("#button-document-ignore").off('click');
            $("#button-document-validation").hide();
            $("#button-document-update").hide();
            $("#button-document-ignore").hide();

            $("#previousDocumentButton").addClass('disabled');
            $("#previousDocumentButton").show();
            $("#nextDocumentButton").addClass('disabled');
            $("#nextDocumentButton").show();

            displayDocumentArea(userInfo, response, taskInfo, labels, otherLabels, labelColorMap, rank, rankExcerpt);
        }
    }
    xhr.send(null);
}

function displayExcerptAreaLabeling(positionId, userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptItem) {

    // get inline tag annotations, if any
    var url = defineBaseURL("annotations/excerpt/"+excerptItem["id"]+"?type=labeling");

    // retrieve the existing annotation information
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    
    var labelMap = createLabelMap(labels);

    xhr.onloadend = function () {
        // list of existing inline annotations 
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
                inlineLabeling.push(record);
            }
        }

        // now display the excerpt
        var docInfoText = docInfoTemplate
                            .replace("{{level}}", "Document")
                            .replace("{{rank}}", (rank+1))
                            .replace("{{totalRank}}", taskInfo["nb_excerpts"]);

        var fullContext = excerptItem["full_context"];
        initRecogitoLabelingArea(fullContext, positionId, docInfoText, labels, inlineLabeling, labelMap, labelColorMap);
        setDocumentInfo(excerptItem["document_id"]);
    }

    xhr.send(null);
}    

function initRecogitoLabelingArea(fullContext, positionId, docInfoText, labels, inlineLabeling, labelMap, labelColorMap) {
    $(positionId).html(docInfoText + "<pre id=\"content-annotation\">"+fullContext+"</pre>");

    recognito = Recogito.init({
        content: document.getElementById('content-annotation'), 
        //disableEditor: true,
        mode: "pre",
        formatter: formatter,
        widgets: [
            { widget: LabelSelectorWidget, labels: labels }
        ],
        relationVocabulary: ['related']
    });
    recognito_mode = 'ANNOTATION';

    $("#button_relation").bind('click', callRelation); 

    // labeling event handler  
    recognito.on('createAnnotation', function(annotation, overrideId) {
        recognito.setMode('ANNOTATION');
        recognito_mode = 'ANNOTATION';
        document.body.style.cursor = "default";
        $("#button_relation").removeClass("selected");
    });

    recognito.on('deleteAnnotation', function(annotation, overrideId) {
        // POST to the server and receive a new ID
        recognito.setMode('ANNOTATION');
        recognito_mode = 'ANNOTATION';
        document.body.style.cursor = "default";
        $("#button_relation").removeClass("selected");
    });

    // add annotation for recogito layer
    addInlineAnnotations(fullContext, inlineLabeling, labelMap, labelColorMap);
}

var formatter = function(annotation) {
    var classValue = annotation.bodies[0].value;
    classValue = classValue.replace("/", "-");
    return "label " + classValue;
}

function displayLabelAreaLabeling(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptItem) {    
    var labelHtmlContent = "<div class=\"w-100 text-center d-flex justify-content-around\" style=\"margin-top: auto; margin-bottom: auto;\">";
    const localHeight = 10*labels.length;
    $("#annotation-val-area").css("min-height", localHeight);
    labelHtmlContent += "<p>";
    for(var labelPos in labels) {
        let label = labels[labelPos];
        if (!label["color"])
            label["color"] = getRandomDarkColor();
        labelHtmlContent += "<span type=\"button\" class=\"label btn-sm btn\" style=\"background-color: "+label["color"]+";color:white;\">"+
                            label["name"]+"</span> ";
    }
    labelHtmlContent += "</p>";
    labelHtmlContent += "</div>"

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
            return true;
        });
        $("#button-back").click(function() {
            setExcerptView(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank-1);
            return true;
        });
    }

    $("#button-validate").click(function() {
        validateAnnotation(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptItem["id"], isUserAnnotation, recognito);
        return true;
    });
    
    $("#button-ignore").click(function() {
        ignoreExcerpt(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptItem["id"], isUserAnnotation);
        return true;
    });
    
    if (rank+1 >= taskInfo["nb_excerpts"]) {
        $("#button-next").css("visibility", "hidden");
        $("#button-end").css("visibility", "hidden");
    } else {
        $("#button-next").click(function() {
            setExcerptView(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank+1);
            return true;
        });
        $("#button-end").click(function() {
            setExcerptView(userInfo, taskInfo, labels, otherLabels, labelColorMap, taskInfo["nb_excerpts"]-1);
            return true;
        });
    }
}

function addInlineAnnotations(fullContext, inlineLabeling, labelMap, labelColorMap) {

    if (inlineLabeling == null || inlineLabeling.length == 0) 
        return;

    // check if we have a pre-annotated excerpt or manual annotation (we don't want to mix them)
    const isPreAnnotation = checkPreAnnotation(inlineLabeling);
    
    for (var labelingPos in inlineLabeling) {
        var inlineAnnotation = inlineLabeling[labelingPos];

        if (!isPreAnnotation && inlineAnnotation["source"] === "automatic")
            continue;

        var labelName = labelMap[inlineAnnotation["label_id"]];
        var annotation = { 
            "@context": "http://www.w3.org/ns/anno.jsonld",
            "type": "Annotation",
            "body": [
                {
                    "type": "TextualBody",
                    "purpose": "tagging"
                }
            ],
            "target": {
                "selector": [
                    {
                        "type": "TextQuoteSelector"
                    },
                    {
                        "type": "TextPositionSelector"
                    }
                ]
            }
        };

        annotation["body"][0]["value"] = labelName;
        annotation["target"]["selector"][0]["exact"] = inlineAnnotation["chunk"];
        annotation["target"]["selector"][1]["start"] = inlineAnnotation["offset_start"];
        annotation["target"]["selector"][1]["end"] = inlineAnnotation["offset_end"];
        annotation["id"] = inlineAnnotation["id"];

        recognito.addAnnotation(annotation);
    }
}

// add a button for switching to relation mode from the annotation
var callRelation = function() {
    if (recognito_mode === "ANNOTATION") {
        console.log("set mode to relations")
        recognito.setMode('RELATIONS');
        recognito_mode = 'RELATIONS';
        // change pointer 
        document.body.style.cursor = "ew-resize";
        $("#button_relation").addClass("selected");
    } else {
        recognito.setMode('ANNOTATION');
        recognito_mode = 'ANNOTATION';
        // restore pointer 
        document.body.style.cursor = "default";
        $("#button_relation").removeClass("selected");
    }
};
