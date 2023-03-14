/**
 * functions related to a field labeling task
 **/

var recognito;

/**
 * Label editor plugin
 **/
var LabelSelectorWidget = function(args) {

    // get task label infos
    var labels = args.labels ? args.labels : [];

    var currentAnnotation = args.annotation;
    console.log(currentAnnotation);
    console.log(currentAnnotation.id);

    var activeLabel = function(evt) { 
        console.log(evt)
        if (evt.target.classList.contains('selected')) {
            // if label already selected, remove annotation
            
            console.log("contain selected");

            if (currentAnnotation && currentAnnotation.bodies && currentAnnotation.bodies.length>0 && currentAnnotation.bodies[0].value === evt.target.textContent) {
                console.log(currentAnnotation.id);
                args.onRemoveBody(currentAnnotation.bodies[0]);
            }
            /*args.onRemoveBody({
                type: 'TextualBody',
                purpose: 'tagging',
                value: evt.target.textContent
            }); */

            // and deselect label
            evt.target.classList.remove("selected");
        } else {
            // if label not yet selected
            args.onAppendBody({
                type: 'TextualBody',
                purpose: 'tagging',
                value: evt.target.textContent
            });
            evt.target.classList.add("selected");
        }
    }

    var createButton = function(label) {
        var button = document.createElement('button');
        button.className = 'btn-sm btn';
        button.setAttribute('type', 'button');
        button.textContent = label["name"];
        if (label["color"]) {
            button.style.backgroundColor = label["color"];
            button.style.color = "white";
        } else {
            button.style.backgroundColor = getRandomLightColor();
            button.style.color = "black";
        }
        button.addEventListener('click', activeLabel); 
        return button;
    }

    var container = document.createElement('div');
    //container.className = 'r6o-widget r6o-tag';
    //container.className = 'r6o-widget';
    
    for (var labelPos in labels) {
        var button = createButton(labels[labelPos]);
        button.style["margin-right"] = "5px";
        button.style["margin-top"] = "5px";
        if (currentAnnotation && currentAnnotation.bodies && currentAnnotation.bodies.length>0 && currentAnnotation.bodies[0].value === labels[labelPos]["name"]) {
            button.classList.add("selected");
        } else {
            button.classList.add("disabled");
        }

        container.appendChild(button);
    }

    return container;
}
  
function displayExcerptAreaLabeling(userInfo, taskInfo, labels, otherLabels, rank, excerptItem) {
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
                //if (inlineLabels != null && inlineLabels.indexOf(localLabelId) != -1) 
                {
                    inlineLabeling.push(record);
                }
            }
        }

        // now display the excerpt
        var docInfoText = "<div class=\"pb-2\"><p>Task excerpt " + (rank+1) + " / " + taskInfo["nb_excerpts"] + " - " + "<span id=\"doc_url\"></span></p></div>"

        var fullContext = excerptItem["full_context"];
        var context = excerptItem["text"];
        var ind = fullContext.indexOf(context);

        if (inlineLabeling != null && inlineLabeling.length > 0) {
            context = applyInlineAnnotations(context, inlineLabeling, labels);
        } else {
            context = he.encode(context);
        }

        $("#annotation-doc-view").html(docInfoText + "<p id=\"content-annotation\">"+fullContext+"</p>");

        recognito = Recogito.init({
            content: document.getElementById('content-annotation'), 
            //disableEditor: true,
            mode: "html",
            formatter: formatter,
            widgets: [
                { widget: LabelSelectorWidget, labels: labels }
            ] 
        });

        // labeling event handler  
        recognito.on('createAnnotation', function(annotation, overrideId) {
            // POST to the server and receive a new ID
            console.log(annotation);
        });

        /*if (ind != -1) {
            var excerptText = "<span style=\"color: grey;\">" + he.encode(fullContext.substring(0, ind)) + "</span>" + 
                context + 
                "<span style=\"color: grey;\">" + he.encode(fullContext.substring(ind+context.length)) + "</span>";

            $("#annotation-doc-view").html(docInfoText + "<pre>"+excerptText+"</pre>");
        } else {
            $("#annotation-doc-view").html(docInfoText + "<pre>"+context+"</pre>");
        }*/

        setDocumentInfo(excerptItem["document_id"]);
    }

    xhr.send(null);
}    

var formatter = function(annotation) {
    return "label " + annotation.bodies[0].value;
}

function displayLabelAreaLabeling(userInfo, taskInfo, labels, otherLabels, rank, excerptIdentifier) {    
    var labelHtmlContent = "<div class=\"w-100 text-center d-flex justify-content-around\" style=\"margin-top: auto; margin-bottom: auto;\">";
    const localHeight = 40*labels.length;
    $("#annotation-val-area").css("min-height", localHeight);
    for(var labelPos in labels) {
        let label = labels[labelPos];
        if (!label["color"])
            label["color"] = getRandomLightColor();
        labelHtmlContent += "<button id=\"button-ignore\" type=\"button\" class=\"sb-1 btn  \" style=\"background-color: "+label["color"]+";color:white;\">"+
                            label["name"]+"</button>";
    }
    labelHtmlContent += "</div>"
    $("#annotation-val-area").html(labelHtmlContent);
}

function applyInlineAnnotations(context, inlineLabeling, otherLabels) {

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
        //var endA = parseInt(a.offsetEnd, 10);

        var startB = parseInt(b.offset_start, 10);
        //var endB = parseInt(b.offsetEnd, 10);

        return startA-startB; 
    });

    var pos = 0; // current position in the text
    var newString = ""
    for (var pi in pieces) {
        piece = pieces[pi];

        //var entityRawForm = piece.rawForm;
        var start = parseInt(piece.offset_start, 10);
        var end = parseInt(piece.offset_end, 10);

        if (start < pos) {
            // we have a problem in the initial sort of the entities
            // the server response is not compatible with the present client 
            console.log("Sorting of inline entities as present in the server's response not valid for this client.");
            // note: this should never happen
        } else {
            newString += he.encode(context.substring(pos, start))
                //+ '<span id="annot-' + currentEntityIndex + '" rel="popover" data-color="' + piece['subtype'] + '">'
                //+ '<span id="annot-' + currentEntityIndex + '-' + pi + '">'
                //+ '<span class="label ' + piece['subtype'] + '" style="cursor:hand;cursor:pointer;" >'
                + '<span class="label ' + piece['subtype'] + '" style="" >'
                + he.encode(context.substring(start, end)) + '<span class="tooltiptext">'+piece['subtype']+'</span></span>';
            pos = end;
        }
    }
    newString += he.encode(context.substring(pos, context.length));
    return newString;
}
