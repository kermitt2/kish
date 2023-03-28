/**
 * functions related to document layout view (PDF/TEI XML pair)
 **/

var sentencesMapping = {}
var pageDimensions = {}
var localExcerpts = {}
var localExcerptsList = []

var userInfo;
var currentDocument; 
var taskInfo;
var labels;
var otherLabels; 
var labelColorMap; 
var rankDocument;
var rankExcerpt;
var inlineLabeling;
var labelMap;

// maximum number of PDF sentence segments to consider (note: to be removed for a single area solution when ready)
const maxSegment = 20;

function httpGetAsynBlob(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.responseType = 'blob';
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            callback(xmlHttp.response);
        } else if (xmlHttp.status == 401) {
            window.location.href = "sign-in.html";
        } else if (xmlHttp.status >= 400) {
            $("#annotation-doc-view").empty();
            $("#annotation-doc-view").append(
                '<div class="row" style="width: 68%; padding:10px; text-align: center;">' +
                '<font color="red">Failed to access online PDF</font></div>'
            );
        }
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}

function parseTEI(xmlBlb, callback) {
    //console.log(xmlBlb);

    const reader = new FileReader();

    // This fires after the blob has been read/loaded.
    reader.addEventListener('loadend', (e) => {
        const text = e.srcElement.result;
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "application/xml");
        const errorNode = doc.querySelector("parsererror");
        if (errorNode) {
            console.log("error while parsing");
        }
        callback(doc);
    });

    // Start reading the blob as text.
    reader.readAsText(xmlBlb);
}

function displayDocumentArea(userInfo_, currentDocument_, taskInfo_, labels_, otherLabels_, labelColorMap_, rankDocument_, rankExcerpt_) {
    /**
     * panel #annotation-doc-view displays a PDF in its own scroll space
     * panel #annotation-val-view displays a fixed labeling area based on the sentence/paragraph selected on the PDF
     **/ 

    // clear annotation view
    $("#annotation-val-area").html("");
    $("#annotation-paging").html("");
    $("#document-view").html("");
    $("#annotation-doc-view").html("");

    // clear sentence annotation/mapping
    sentencesMapping = {};
    pageDimensions = {};
    localExcerpts = {}
    localExcerptsList = [];

    userInfo = userInfo_;
    currentDocument = currentDocument_; 
    taskInfo = taskInfo_;
    labels = labels_;
    otherLabels = otherLabels_; 
    labelColorMap = labelColorMap_; 
    rankDocument = rankDocument_;
    rankExcerpt = rankExcerpt_;

    labelMap = createLabelMap(labels);

    const documentId = currentDocument["id"];

    // get existing excerpts of this document for the current task
    var url = defineBaseURL("tasks/"+taskInfo["id"]+"/document/"+documentId+"/excerpts");

    // retrieve the existing excerpt information
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    
    xhr.onloadend = function () {
        // list of existing inline annotations 
        // status
        if (xhr.status == 401) {
            window.location.href = "sign-in.html";
        } else if (xhr.status != 200) {
            // display server level error
            var response = JSON.parse(xhr.responseText);
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, getting excerpt annotations didn't work!");
        } else {
            var response = JSON.parse(xhr.responseText);
            records = response["records"];
            for(var recordPos in records) {
                let record = records[recordPos];
                localExcerpts[record["id"]] = record;
                localExcerptsList.push(record["id"]);
                //console.log(localExcerpts[record["id"]]);
            }
        }
        showDocument(documentId);
    }
    xhr.send(null);

    $("#button-document-validation").attr('document-id', documentId);
    $("#button-document-update").attr('document-id', documentId);
    $("#button-document-ignore").attr('document-id', documentId);

    // document status for this task and set the document-level buttons
    if (currentDocument["ignored"] == 1) {
        $("#button-document-update").addClass("inactive");
        $("#button-document-update").show();
        $("#button-document-update").click(function() {
            updateDocument(userInfo, taskInfo, documentId);
            return true;
        });
        $("#button-document-ignore").addClass("ignored");
        $("#button-document-ignore").html("Ignored");
        $("#button-document-ignore").show();
        $("#button-document-ignore").attr('document-id', documentId);
        $("#button-document-ignore").click(function() {
            ignoreDocument(userInfo, taskInfo, documentId);
            return true;
        });
    } else if (currentDocument["validated"] == 1) {
        $("#button-document-update").removeClass("inactive");
        $("#button-document-update").show();
        $("#button-document-update").click(function() {
            updateDocument(userInfo, taskInfo, documentId);
            return true;
        });
        $("#button-document-ignore").removeClass("ignored");
        $("#button-document-ignore").html("Ignore doc.");
        $("#button-document-ignore").show();
        $("#button-document-ignore").click(function() {
            ignoreDocument(userInfo, taskInfo, documentId);
            return true;
        });
    } else {
        $("#button-document-validation").show();
        $("#button-document-validation").click(function() {
            validateDocument(userInfo, taskInfo, documentId);
            return true;
        });
        $("#button-document-ignore").removeClass("ignored");
        $("#button-document-ignore").html("Ignore doc.");
        $("#button-document-ignore").show();
        $("#button-document-ignore").click(function() {
            ignoreDocument(userInfo, taskInfo, documentId);
            return true;
        });
    }
}

async function showDocument(documentId) {
    // stream and display the document
    pdf_url = defineBaseURL("documents/"+documentId+"/pdf");

    var nbPages = -1;

    $("#annotation-doc-view").empty();
    $("#annotation-doc-view").html('<div id="info-fetch" class="row justify-content-center" style="width: 100%; padding:10px; text-align: center;"></div>'+
        '<div id="document-view" style="overflow-y:auto; height:100vh; position:relative;"></div>');

    $("#info-fetch").html('<p style="color:white;"><div class="spinner-border" style="color: #7DBCFF;" role="status">'+
                '<span class="sr-only">Loading...</span></div> <span style="padding-left: 10px; padding-top:7px;">fetching PDF...</span></p>');

    // info on PDF download
    /*$("#annotation-doc-view").append(
        '<div class="row" style="width: 68%; padding:10px; text-align: center;">' +
        '<p style="color:white;">fetching PDF...</p></div>'
    );*/

    // display the local PDF
    var reader = new FileReader();
    reader.onloadend = await function () {
        // to avoid cross origin issue
        //PDFJS.disableWorker = true;
        var pdfAsArray = new Uint8Array(reader.result);
        // Use PDFJS to render a pdfDocument from pdf array
        PDFJS.getDocument(pdfAsArray).then(async function (pdf) {
            
            //$('#requestResult').html('');
            nbPages = pdf.numPages;
            /*$("#annotation-doc-view").empty();
            $("#annotation-doc-view").html('<div id="info-fetch" class="row" style="width: 100%; padding:10px; text-align: center;></div>'+
                '<div id="document-view" style="overflow-y:auto; height:100vh; position:relative;"></div>');*/
              
            // Get div#document-view
            var container = document.getElementById("document-view");

            // enable hyperlinks within PDF files, or not if in comment
            //var pdfLinkService = new PDFJS.PDFLinkService();
            //pdfLinkService.setDocument(pdf, null);

            // info on annotation download and mapping
            /*$("#annotation-doc-view").append(
                '<div class="row" style="width: 100%; padding:10px; text-align: center;">' +
                '<p style="color:#BC0E0E;">fetching annotations...</p></div>'
            );*/
            $("#info-fetch").html('<p style="color:white;"><div class="spinner-border" style="color: #7DBCFF;" role="status">'+
                '<span class="sr-only">Loading...</span></div> <span style="padding-left: 10px; padding-top:7px;">fetching annotations...</span></p>');

            // Loop from 1 to total_number_of_pages in PDF document
            for (var i = 1; i <= nbPages; i++) {

                // Get desired page
                var page = await pdf.getPage(i);

                var table = document.createElement("table");
                table.setAttribute('id', 'page-row-'+i);
                table.setAttribute('style', 'table-layout: fixed; width: 100%;');
                var tr = document.createElement("tr");
                var td1 = document.createElement("td");
                var td2 = document.createElement("td");

                tr.appendChild(td1);
                tr.appendChild(td2);
                table.appendChild(tr);

                var div0 = document.createElement("div");
                div0.setAttribute("style", "text-align: center; margin-top: 1cm;");
                var pageInfo = document.createElement("p");
                var t = document.createTextNode("page " + (page.pageIndex + 1) + "/" + (nbPages));
                pageInfo.appendChild(t);
                div0.appendChild(pageInfo);

                td1.appendChild(div0);

                var div = document.createElement("div");

                // Set id attribute with page-#{pdf_page_number} format
                div.setAttribute("id", "page-" + (page.pageIndex + 1));

                // This will keep positions of child elements as per our needs, and add a light border
                div.setAttribute("style", "position: relative; ");

                // Create a new Canvas element
                var canvas = document.createElement("canvas");
                canvas.setAttribute("style", "border-style: solid; border-width: 0px; border-color: gray;");

                // Append Canvas within div#page-#{pdf_page_number}
                div.appendChild(canvas);

                // Append div within div#container
                td1.setAttribute('style', 'width:100%;');
                td1.appendChild(div);

                /*var annot = document.createElement("div");
                annot.setAttribute('style', 'vertical-align:top;');
                annot.setAttribute('id', 'detailed_annot-' + (page.pageIndex + 1));
                td2.setAttribute('style', 'vertical-align:top;width:30%;');
                td2.appendChild(annot);*/

                container.appendChild(table);

                // we could think about a dynamic way to set the scale based on the available parent width
                var viewport = page.getViewport((td1.offsetWidth * 1.0) / page.getViewport(1.0).width);

                var context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                var renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };

                //await page.render(renderContext);

                const textContent = await page.render(renderContext).then(function () {
                    // Get text-fragments
                    return page.getTextContent();
                });

                //const textContent = page.getTextContent();
                var textLayerDiv = document.createElement("div");

                // Set class to textLayer which have required CSS styles
                textLayerDiv.setAttribute("class", "textLayer");
                //textLayerDiv.setAttribute('style', 'width: 100%;');
                //textLayerDiv.setAttribute('style', 'height: 100%;');

                // Append newly created div in `div#page-#{pdf_page_number}`
                div.appendChild(textLayerDiv);

                // Create new instance of TextLayerBuilder class
                var textLayer = new TextLayerBuilder({
                    textLayerDiv: textLayerDiv,
                    pageIndex: page.pageIndex,
                    viewport: viewport
                });

                // Set text-fragments
                textLayer.setTextContent(textContent);

                // Render text-fragments
                textLayer.render();
            }
            getTEI(documentId);
            $("#info-fetch").empty();
            $("#info-fetch").hide();
        }).catch(error => {
            //$("#annotation-doc-view").empty();
            /*$("#annotation-doc-view").append(
                '<div class="row" style="width: 100%; padding:10px; text-align: center;">' +
                '<font color="red">Failed to render online PDF: ' + error.message + ' </font></div>'
            );*/
            $("#info-fetch").html('<div class="row" style="width: 100%; padding:10px; text-align: center;">' +
                '<font color="red">Failed to render online PDF: ' + error.message + ' </font></div>');

        });
    }
    httpGetAsynBlob(pdf_url, res => reader.readAsArrayBuffer(res));
}

function getTEI(documentId) {
    // read and parse TEI
    var urlTEI = defineBaseURL("documents/"+documentId+"/tei");
    httpGetAsynBlob(urlTEI, res => parseTEI(res, getSentences));
}

function getSentences(tei) {
    // first get page width and height for scaling sentence bounding boxes
    var surfaceNodes = tei.getElementsByTagName("surface");
    for(var surfaceNodePos in surfaceNodes) {
        const surfaceNode = surfaceNodes[surfaceNodePos];

        // format is <surface n="1" ulx="0.0" uly="0.0" lrx="595.276" lry="782.362"/>

        var pagenum;
        var pageheight;
        var pageWidth;
        try {
            pagenum = surfaceNode.getAttribute("n");
            x = surfaceNode.getAttribute("ulx");
            y = surfaceNode.getAttribute("uly");
            w = surfaceNode.getAttribute("lrx");
            h = surfaceNode.getAttribute("lry");
            pageheight = h - y;
            pageWidth = w - x;
        } catch(err) {
            continue;
        }

        pageDimensions[pagenum] = { width: pageWidth, height: pageheight };
    }

    // get all <s> element coordinates
    var sentenceNodes = tei.getElementsByTagName("s");
    for(var sentenceNodePos in sentenceNodes) {
        const sentenceNode = sentenceNodes[sentenceNodePos];

        //console.log(sentenceNode);

        var sentenceInfo = {};
        var identifier;
        var coords;
        try {
            identifier = sentenceNode.getAttribute("xml:id");
            coords = sentenceNode.getAttribute("coords");
        } catch(err) {
            continue;
        }

        sentenceInfo["id"] = identifier;
        const coordsList = coords.split(';');
        var sentenceBoxes = [];
        for(var index in coordsList) {
            const coord = coordsList[index];
            var sentenceBox = {};

            const coordField = coord.split(',');
            if (coordField.length != 5)
                continue;

            sentenceBox["p"] = coordField[0];
            sentenceBox["x"] = coordField[1];
            sentenceBox["y"] = coordField[2];
            sentenceBox["w"] = coordField[3];
            sentenceBox["h"] = coordField[4];

            sentenceBoxes.push(sentenceBox);
        }
        sentenceInfo["coordinates"] = sentenceBoxes;

        var localText = sentenceNode.textContent;
        sentenceInfo["text"] = localText;

        //console.log(sentenceInfo);

        sentencesMapping[identifier] = sentenceInfo;
    }

    showSentences();
}

function showSentences() {
    for (var id in sentencesMapping) {
        if (sentencesMapping.hasOwnProperty(id)) {
            for (var sentenceBoxPos in sentencesMapping[id]["coordinates"]) {
                const sentenceBox = sentencesMapping[id]["coordinates"][sentenceBoxPos];
                const page = sentenceBox["p"];

                const pageWidth = getPageWidth(page);
                const pageHeight = getPageHeight(page);

                var pageDiv = $('#page-'+page);
                var canvas = pageDiv.children('canvas').eq(0);;

                var canvasHeight = canvas.height();
                var canvasWidth = canvas.width();
                var scale_y = canvasHeight / pageHeight;
                var scale_x = canvasWidth / pageWidth;

                var x = (sentenceBox["x"] * scale_x) - 1;
                var y = (sentenceBox["y"] * scale_y) - 1;
                var width = (sentenceBox["w"] * scale_x) + 1;
                var height = (sentenceBox["h"] * scale_y) + 1;

                //make clickable the area
                //console.log("make clickable area");
                //console.log(page + " " + x + " " + y + " " + width + " " + height);

                var element = document.createElement("a");
                element.setAttribute("class", "sentenceBox");
                var attributes = "width:"+width+"px; height:"+height+"px; top:"+ y+"px; left:"+x+"px;";
                element.setAttribute("style", attributes);
                element.setAttribute("id", 'sentence-' + id + '-' + sentenceBoxPos);
                element.setAttribute("page", page);
                pageDiv.append(element);
                $('#sentence-' + id + '-' + sentenceBoxPos).bind('click', selectSentence);
                if (localExcerpts[id]) {
                    $('#sentence-' + id + '-' + sentenceBoxPos).addClass("activated");
                }
            }
        }
    }

    localExcerptsList.sort(sortExcerpts);

    // init labeling view on the first annotated sentence
    if (localExcerptsList.length>0) {
        $('#sentence-' +  localExcerptsList[0] + '-0').trigger('click');
        // scroll to
        const local_target = document.querySelector('#sentence-' +  localExcerptsList[0] + '-0');
        const pageRow = local_target.parentNode;
        const pageRowTopPos = pageRow.offsetTop;
        const topPos = local_target.offsetTop + pageRowTopPos - 100;
        document.getElementById('document-view').scrollTop = topPos;
    }
}   

function getPageHeight(pagenum) {
    if (pageDimensions[pagenum]) {
        return pageDimensions[pagenum]["height"];
    } 
    return 0; 
}

function getPageWidth(pagenum) {
    if (pageDimensions[pagenum]) {
        return pageDimensions[pagenum]["width"];
    } 
    return 0; 
}

function selectSentence() {
    // de-select any other sentences
    $(".selected").each(function() {
        $(this).removeClass("selected");
    });

    var pageIndex = $(this).attr('page');
    var localID = $(this).attr('id');

    var sentenceId = localID.replace("sentence-", "");
    const ind = sentenceId.indexOf("-");
    sentenceId = sentenceId.substring(0,ind);

    const sentenceInfo = sentencesMapping[sentenceId];
    const nbSegments = sentenceInfo["coordinates"].length;

    //console.log(sentenceInfo)

    for(var i=0; i<nbSegments; i++) {
        var segmentID = 'sentence-' + sentenceId + '-' + i;
        if ($("#"+segmentID).hasClass("selected")) {
            $("#"+segmentID).removeClass("selected");
        } else {
            $("#"+segmentID).addClass("selected");      
        }
    }

    //console.log(localID);
    // current excerpt rank in the document, by default 0
    var rankExcerpt = localExcerptsList.indexOf(sentenceId);
    if (rankExcerpt == -1)
        rankExcerpt = "-";
    else
        rankExcerpt += 1;

    // do we have annotations for this excerpt?
    var url = defineBaseURL("annotations/excerpt/"+sentenceId+"?type=labeling");

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onloadend = function () {

        if (xhr.status == 401) { 
            window.location.href = "sign-in.html";
        } else if (xhr.status != 200) {
            // display server level error
            var response = JSON.parse(xhr.responseText);
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, updating document didn't work!");
        } else {
            var inlineLabeling = [];
            var response = JSON.parse(xhr.responseText);
            records = response["records"];
            for(var recordPos in records) {
                let record = records[recordPos];
                inlineLabeling.push(record);
            }

            var excerptInfo = docInfoTemplate
                                    .replace("{{level}}", "Document")
                                    .replace("{{rank}}", rankExcerpt)
                                    .replace("{{totalRank}}", (localExcerptsList.length));

            initRecogitoLabelingArea(sentenceInfo["text"], "#annotation-val-area", excerptInfo, labels, inlineLabeling, labelMap, labelColorMap)

            if (localExcerpts[sentenceId])
                displayDocumentLabelAreaLabeling(userInfo, taskInfo, labels, otherLabels, labelColorMap, rankDocument, localExcerpts[sentenceId]);
            else
                displayDocumentLabelAreaLabeling(userInfo, taskInfo, labels, otherLabels, labelColorMap, rankDocument, { "id": sentenceId });
        }
    }

    xhr.send(null);   
}

function validateDocument(userInfo, taskInfo, document_id) {
    var url = defineBaseURL("tasks/"+taskInfo["id"]+"/document/validate");
    var data = {}
    data["document_id"] = document_id;

    var xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    $("#button-document-validation").hide();
    $("#button-document-update").show();

    xhr.onloadend = function () {
        if (xhr.status == 401) { 
            window.location.href = "sign-in.html";
        } else if (xhr.status != 200) {
            // display server level error
            var response = JSON.parse(xhr.responseText);
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, updating document didn't work!");
        } else {
            // update counters
            var currentcountStr = $("#progress-done").text();
            var currentCount = parseInt(currentcountStr);
            $("#progress-done").html(""+(currentCount+1));

            if ((currentCount+1) === taskInfo["nb_documents"]) {
                $("#progress-complete").html("<span style=\"color: green;\">Completed !</span>");

                // update task status
                updateTaskAssignment(taskInfo["id"], 1, 0, (currentCount+1));
            } else {
                updateTaskAssignment(taskInfo["id"], 0, 0, (currentCount+1));
            }

            // validate every excerpts in the doc
            for(var key in sentencesMapping) {
                if (!sentencesMapping[key]["validated"]) {
                    sentencesMapping[key]["validated"] = 1;
                    // check that still open excerpts for this doc should be set valid on server side too
                }
            }

            callToaster("toast-top-center", "success", "the document is validated", "Yes!", "1000");
        }
    }

    xhr.send(JSON.stringify(data));   
}

function updateDocument(userInfo, taskInfo, document_id) {
    $("#button-document-validation").hide(); // should be hidden anyway here
    $("#button-document-update").removeClass("inactive");
    $("#button-document-update").show();
    $("#button-document-ignore").removeClass("ignored");
    $("#button-document-ignore").html("Ignore doc.");

    // update server status, document is not anymore ignored so we consider it is similar to validation
    var url = defineBaseURL("tasks/"+taskInfo["id"]+"/document/validate");
    var data = {}
    data["document_id"] = document_id;

    var xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onloadend = function () {
        if (xhr.status == 401) { 
            window.location.href = "sign-in.html";
        } else if (xhr.status != 200) {
            // display server level error
            var response = JSON.parse(xhr.responseText);
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, updating document didn't work!");
        } else {
            var currentcountStr = $("#progress-done").text();
            var currentCount = parseInt(currentcountStr);

            // no counter progress necessary because the document was already completed
            
            if ((currentCount) === taskInfo["nb_documents"]) {
                $("#progress-complete").html("<span style=\"color: green;\">Completed !</span>");

                // update task status
                updateTaskAssignment(taskInfo["id"], 1, 0, (currentCount+1));
            } else {
                updateTaskAssignment(taskInfo["id"], 0, 0, (currentCount+1));
            }

            callToaster("toast-top-center", "success", "the document is updated", "Yes!", "1000");
        }
    }

    xhr.send(JSON.stringify(data));
}

function ignoreDocument(userInfo, taskInfo, document_id) {
    var url = defineBaseURL("tasks/"+taskInfo["id"]+"/document/ignore");
    var data = {}
    data["document_id"] = document_id;

    var xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onloadend = function () {
        if (xhr.status == 401) { 
            window.location.href = "sign-in.html";
        } else if (xhr.status != 200) {
            // display server level error
            var response = JSON.parse(xhr.responseText);
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, ignoring document didn't work!");
        } else {
            // update counters if the document was not already validated before
            if ($("#button-document-validation").css("display") !== "none") {
                var currentcountStr = $("#progress-done").text();
                var currentCount = parseInt(currentcountStr);
                $("#progress-done").html(""+(currentCount+1));

                if ((currentCount+1) === taskInfo["nb_documents"]) {                
                    $("#progress-complete").html("<span style=\"color: green;\">Completed !</span>");
                    updateTaskAssignment(taskInfo["id"], 1, 0, currentCount+1);
                } else {
                    // update task status
                    updateTaskAssignment(taskInfo["id"], 0, 0, currentCount+1);
                }
            }

            $("#button-document-validation").hide();
            $("#button-document-update").addClass("inactive");
            $("#button-document-update").show();
            $("#button-document-ignore").addClass("ignored");
            $("#button-document-ignore").html("Ignored");
            $("#button-document-ignore").show();

            callToaster("toast-top-center", "success", "the document is ignored", "Yes!", "1000");
        }
    }

    xhr.send(JSON.stringify(data));   
}

function displayDocumentLabelAreaLabeling(userInfo, taskInfo, labels, otherLabels, labelColorMap, rankDocument, excerptItem) {    
    const rankExcerpt = localExcerptsList.indexOf(excerptItem["id"]);

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

    var navigationButton = true;
    if (localExcerptsList.indexOf(excerptItem["id"]) == -1) {
        // this is a free selection not yet validated and sorted, so no "navigation" button et this stage
        navigationButton = false;
    }

    if (rankExcerpt == 0 || !navigationButton) {
        $("#button-start").css("visibility", "hidden");
        $("#button-back").css("visibility", "hidden");
    } else if (navigationButton) {
        $("#button-start").click(function() {
            $('#sentence-' +  localExcerptsList[0] + '-0').trigger('click');
            const local_target = document.querySelector('#sentence-' +  localExcerptsList[0] + '-0');
            const pageRow = local_target.parentNode;
            const pageRowTopPos = pageRow.offsetTop;
            const topPos = local_target.offsetTop + pageRowTopPos - 100;
            document.getElementById('document-view').scrollTop = topPos;
            return true;
        });
        $("#button-back").click(function() {
            $('#sentence-' +  localExcerptsList[rankExcerpt-1] + '-0').trigger('click');
            const local_target = document.querySelector('#sentence-' +  localExcerptsList[rankExcerpt-1] + '-0');
            const pageRow = local_target.parentNode;
            const pageRowTopPos = pageRow.offsetTop;
            const topPos = local_target.offsetTop + pageRowTopPos - 100;
            document.getElementById('document-view').scrollTop = topPos;
            return true;
        });
    } 

    $("#button-validate").click(function() {
        const local_document_id = $("#button-document-validation").attr("document-id");
        var isUpdate = false;
        if (navigationButton) {
            // annotated excerpt on server
            isUpdate = true;
        }
        createExcerptIfNeeded(userInfo, taskInfo, excerptItem["id"], local_document_id, $("#content-annotation").text());
        validateAnnotation(userInfo, taskInfo, labels, otherLabels, labelColorMap, rankExcerpt, excerptItem["id"], isUpdate, recognito);
        const sentenceInfo = sentencesMapping[excerptItem["id"]];
        const nbSegments = sentenceInfo["coordinates"].length;
        for(var i=0; i<nbSegments; i++) {
            var segmentID = 'sentence-' + excerptItem["id"] + '-' + i;
            if ($("#"+segmentID).hasClass("selected")) {
                $("#"+segmentID).removeClass("selected");
            }
            $("#"+segmentID).addClass("activated");
        }
        return true;
    });
    
    $("#button-ignore").click(function() {
        // we simply discard current excerpt
        $("#annotation-val-area").html("");
        $("#annotation-paging").html("");
        
        console.log("in button-ignore");

        if (localExcerptsList.indexOf(excerptItem["id"]) != -1) {
            // remove excerpt on server with all its annotations

            console.log("remove task excerpt");
            removeTaskExcerpt(userInfo, taskInfo, excerptItem["id"]);

            // remove excerpt locally
            const ind = localExcerptsList.indexOf(excerptItem["id"]);
            if (ind != -1) {
                localExcerptsList.splice(ind, 1);
            }
            delete(localExcerpts[excerptItem["id"]]);
        }
        // unselect corresponding sentence
        for(var i=0; i<maxSegment; i++) {
            var segmentID = 'sentence-' + excerptItem["id"] + '-' + i;
            if ($("#"+segmentID).hasClass("selected")) {
                $("#"+segmentID).removeClass("selected");
            }
            if ($("#"+segmentID).hasClass("activated")) {
                $("#"+segmentID).removeClass("activated");
            }
        }
        return true;
    });
    
    if (rankExcerpt+1 >= localExcerptsList.length || !navigationButton) {
        $("#button-next").css("visibility", "hidden");
        $("#button-end").css("visibility", "hidden");
    } else if (navigationButton) {
        $("#button-next").click(function() {
            $('#sentence-' +  localExcerptsList[rankExcerpt+1] + '-0').trigger('click');
            const local_target = document.querySelector('#sentence-' +  localExcerptsList[rankExcerpt+1] + '-0');
            const pageRow = local_target.parentNode;
            const pageRowTopPos = pageRow.offsetTop;
            const topPos = local_target.offsetTop + pageRowTopPos - 100;
            document.getElementById('document-view').scrollTop = topPos;
            return true;
        });
        $("#button-end").click(function() {
            $('#sentence-' +  localExcerptsList[localExcerptsList.length-1] + '-0').trigger('click');
            const local_target = document.querySelector('#sentence-' +  localExcerptsList[localExcerptsList.length-1] + '-0');
            const pageRow = local_target.parentNode;
            const pageRowTopPos = pageRow.offsetTop;
            const topPos = local_target.offsetTop + pageRowTopPos - 100;
            document.getElementById('document-view').scrollTop = topPos;
            return true;
        });
    }
}

function createExcerptIfNeeded(userInfo, taskInfo, excerptIdentifier, document_id, textContent) {
    if (localExcerpts[excerptIdentifier]) {
        // excerpt already exists, nothing to do here
        return;
    }

    var url = defineBaseURL("tasks/"+taskInfo["id"]+"/excerpt");

    var data = {}
    data["id"] = excerptIdentifier;
    data["excerpt_id"] = excerptIdentifier;
    data["document_id"] = document_id;
    data["text"] = textContent;
    data["full_context"] = textContent;
    data["dataset_id"] = taskInfo["dataset_id"];

    //console.log(data);

    var xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onloadend = function () {
        if (xhr.status == 401) { 
            window.location.href = "sign-in.html";
        } else if (xhr.status != 200) {
            // display server level error
            var response = JSON.parse(xhr.responseText);
            console.log(response["detail"]);
            callToaster("toast-top-center", "error", response["detail"], "Damn, saving new excerpt didn't work!");
        } else {
            // update local excerpts
            data["validated"] = 1;
            data["ignored"] = 0;
            localExcerpts[excerptIdentifier] = data;
            localExcerptsList.push(excerptIdentifier);
            localExcerptsList.sort(sortExcerpts);
        }
    }

    xhr.send(JSON.stringify(data));   
}

function sortExcerpts(a, b) {
    const excerptA = sentencesMapping[a];
    const excerptB = sentencesMapping[b];

    const coordinatesA = excerptA["coordinates"];
    const coordinatesB = excerptB["coordinates"];

    const pageA = coordinatesA[0]["p"];
    const pageB = coordinatesB[0]["p"];

    const minYA = coordinatesA[0]["y"];
    const minYB = coordinatesB[0]["y"];

    if (pageA !== pageB) 
        return pageA - pageB;
    else if (minYA !== minYB) 
        return minYA - minYB;
    else 
        return 0;
}