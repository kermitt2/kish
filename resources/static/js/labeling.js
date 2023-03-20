/**
 * functions related to a field labeling task
 **/

var recognito;
var recognito_mode;

/**
 * Label editor plugin
 **/
var LabelSelectorWidget = function(args) {

    // get task label infos
    var labels = args.labels ? args.labels : [];
    var currentAnnotation = args.annotation;

    var activateLabel = function(evt) { 
        console.log(evt)
        if (evt.target.classList.contains('disabled')) {
            // do nothing, alternatively we could remove previous selection, annotation and set the new one to this
        } else if (evt.target.classList.contains('selected')) {
            // if label already selected without annotation, just deselect
            evt.target.classList.remove("selected");

            if (currentAnnotation && currentAnnotation.bodies && currentAnnotation.bodies.length>0 && currentAnnotation.bodies[0].value === evt.target.textContent) {
                console.log(currentAnnotation.id);
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
        //container.className = 'r6o-widget r6o-tag';
    container.className = 'r6o-widget';

    for (var labelPos in labels) {
        console.log("create button")

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
  
function displayExcerptAreaLabeling(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptItem) {

    // get inline tag annotations, if any
    var url = defineBaseURL("annotations/excerpt/"+excerptItem["id"]+"?type=labeling");

    // retrieve the existing annotation information
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    
    xhr.onloadend = function () {
        // list of existing inline annotations 
        var inlineLabeling = [];
        // status
        if (xhr.status == 200) {
            var response = JSON.parse(xhr.responseText);
            records = response["records"];
            for(var recordPos in records) {
                let record = records[recordPos];
                const localLabelId = record["label_id"];
                inlineLabeling.push(record);
            }
        }

        // now display the excerpt
        var docInfoText = "<div class=\"pb-2\"><div class=\"row\" style=\"display: flex; align-items: center;\">" + 
            "<div class=\"col\" style=\"display: flex; align-items: center;\"><p>Task excerpt " + (rank+1) + " / " + taskInfo["nb_excerpts"] + " - " + 
            "<span id=\"doc_url\"></span></p></div>" + 
            "<div class=\"col-md-auto\"><button class=\"sb-1 btn-sm btn-relation\" id=\"button_relation\">" + 
            "Relation</button></div></div></div>";

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
        }
        
        var fullContext = excerptItem["full_context"];
        var context = excerptItem["text"];
        var indContext = 0;
        if (context && context.length > 0) {
            var indContext = fullContext.indexOf(context);
            if (indContext == -1)
                indContext = 0;
        }
        $("#annotation-doc-view").html(docInfoText + "<pre id=\"content-annotation\">"+fullContext+"</pre>");

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
            console.log(annotation);

            recognito.setMode('ANNOTATION');
            recognito_mode = 'ANNOTATION';
            document.body.style.cursor = "default";
            $("#button_relation").removeClass("selected");
        });

        recognito.on('deleteAnnotation', function(annotation, overrideId) {
            // POST to the server and receive a new ID
            console.log(annotation);
            recognito.setMode('ANNOTATION');
            recognito_mode = 'ANNOTATION';
            document.body.style.cursor = "default";
            $("#button_relation").removeClass("selected");
        });

        // add annotation for recogito layer
        var labelMap = createLabelMap(labels);
        //console.log(labelMap);
        addInlineAnnotations(fullContext, inlineLabeling, labelMap, labelColorMap, indContext);

        setDocumentInfo(excerptItem["document_id"]);
    }

    xhr.send(null);
}    

var formatter = function(annotation) {
    var classValue = annotation.bodies[0].value;
    classValue = classValue.replace("/", "-");
    return "label " + classValue;
}

function displayLabelAreaLabeling(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptIdentifier) {    
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

    // validation/paging area
    var localWidth = $("#annotation-val-view").width();
    var pagingHtmlContent = "";
    if (localWidth < 500) {
        // we will need to place the navigation buttons under the valid/ignore buttons
        pagingHtmlContent += "<div class=\"row w-100 justify-content-center \" style=\"width: 100%;\">";
        if (isIgnoredExcerpt) {
            pagingHtmlContent += " <button id=\"button-validate\" type=\"button\" class=\"mb-1 btn btn-secondary\">Update</button>";
            pagingHtmlContent += " &nbsp; &nbsp; <button id=\"button-ignore\" type=\"button\" class=\"mb-1 btn \" style=\"background-color: red;color:white;\">Ignored</button>"; 
        } else if (isUserAnnotation) {
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
        } else if (isUserAnnotation) {
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
            setExcerptView(userInfo, taskInfo, labels, otherLabels, labelColorMap, 0);
            return true;
        });
        $("#button-back").click(function() {
            //clearMainContent();
            setExcerptView(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank-1);
            return true;
        });
    }

    $("#button-validate").click(function() {
        validateAnnotation(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptIdentifier, isUserAnnotation, recognito);
        return true;
    });
    
    if (!isIgnoredExcerpt) {
        $("#button-ignore").click(function() {
            ignoreExcerpt(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank, excerptIdentifier, isUserAnnotation);
            return true;
        });
    }
    
    if (rank+1 >= taskInfo["nb_excerpts"]) {
        $("#button-next").css("visibility", "hidden");
        $("#button-end").css("visibility", "hidden");
    } else {
        $("#button-next").click(function() {
            //clearMainContent();
            setExcerptView(userInfo, taskInfo, labels, otherLabels, labelColorMap, rank+1);
            return true;
        });
        $("#button-end").click(function() {
            //clearMainContent();
            setExcerptView(userInfo, taskInfo, labels, otherLabels, labelColorMap, taskInfo["nb_excerpts"]-1);
            return true;
        });
    }
}

function addInlineAnnotations(fullContext, inlineLabeling, labelMap, labelColorMap, indContext) {

    if (inlineLabeling == null || inlineLabeling.length == 0) 
        return;

    // check if we have a pre-annotated excerpt or manual annotation (we don't want to mix them)
    const isPreAnnotation = checkPreAnnotation(inlineLabeling);
    
    for (var labelingPos in inlineLabeling) {
        var inlineAnnotation = inlineLabeling[labelingPos];

        if (!isPreAnnotation && inlineAnnotation["source"] === "automatic")
            continue;

        console.log(inlineAnnotation);

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
        annotation["target"]["selector"][1]["start"] = inlineAnnotation["offset_start"] + indContext;
        annotation["target"]["selector"][1]["end"] = inlineAnnotation["offset_end"] + indContext;
        annotation["id"] = inlineAnnotation["id"];

        recognito.addAnnotation(annotation);
    }
}