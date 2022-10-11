import json
import kish.db
from utils_db import get_items, get_first_item
from datetime import datetime

async def export_dataset_json(dataset_id: str, export_path: str, curator_mode: bool = False):
    """
    Export the annotations in the same JSON format as import, but with user annotations
    and user field. The same case can then appear several times, one per annotator who
    validate an annotation. 

    If curator_mode parameter is True, we export curator-validated annotations and user 
    annotations only when there is no disagreement. This mode is to export a final, curated
    annotated dataset.
    """

    print("export dataset " + dataset_id + " under path " + export_path + "...")

    nb_documents = 0
    nb_excepts = 0
    nb_classification = 0
    nb_labeling = 0

    corpus = {}
    documents =[]
    labels = {}

    # store all the labels in a local map to avoid further loading
    label_items = await get_items("label", {}, full=True)
    for label_item in label_items:
        labels[label_item["id"]] = label_item

    dataset_item = await get_first_item("dataset", { "id": dataset_id} )

    # get all documents of the dataset
    document_ids = await get_items("incollection", { "dataset_id": dataset_id }, full=True)

    for document_id in document_ids:
        document_item = await get_first_item("document", { "id": document_id["document_id"]})
        if "tei_uri" in document_item and document_item["tei_uri"] == None:
            del document_item['tei_uri']
        if "doi" in document_item and document_item["doi"] == None:
            del document_item['doi']
        if "pmid" in document_item and document_item["pmid"] == None:
            del document_item['pmid']
        if "pmc" in document_item and document_item["pmc"] == None:
            del document_item['pmc']
        document_item["texts"] = []
        
        # get all excerpts of the document
        excepts_ids = await get_items("excerpt", { "document_id": document_id["document_id"]})

        # a cache for the tasks to avoid one access for each annotation
        local_tasks = {}

        for excerpt_id in excepts_ids:
            excerpt_item = await get_first_item("excerpt", { "id": excerpt_id } )
            excerpt_json = {}
            excerpt_json["text"] = excerpt_item["text"]
            excerpt_json["full_context"] = excerpt_item["full_context"]

            excerpt_json["entity_spans"] = []
            excerpt_json["class_attributes"] = {}
            excerpt_json["class_attributes"]["classification"] = {}

            # get all annotations of the excerpt
            annotation_ids = await get_items("annotation", { "excerpt_id": excerpt_id })

            for annotation_id in annotation_ids:
                annotation_item = await get_first_item("annotation", { "id": annotation_id } )

                if "user_id" not in annotation_item or annotation_item["user_id"] == None:
                    continue

                if "ignored" in annotation_item and (annotation_item["ignored"] or annotation_item["ignored"] == 1):
                    continue

                # do we have an annotation from a reconciliation task?
                is_curated = False
                if "curated" in annotation_item and annotation_item["curated"] == 1:
                    is_curated = True
                if not is_curated and "task_id" in annotation_item and annotation_item["task_id"] != None:
                    if annotation_item["task_id"] in local_tasks:
                        task_item = local_tasks[annotation_item["task_id"]]
                    else:
                        task_item = await get_first_item("task", { "id": annotation_item["task_id"]})
                        local_tasks[annotation_item["task_id"]]= task_item

                    if task_item != None:
                        if "type" in task_item and task_item["type"] == "reconciliation":
                            is_curated = True

                if annotation_item["type"] == "classification":
                    label_item = labels[annotation_item["label_id"]]
                    if label_item == None:
                        continue

                    classif_item = {}
                    if annotation_item["value"] == 0:
                        classif_item["value"] = False
                    elif annotation_item["value"] == 1:
                        classif_item["value"] = True
                    else:
                        classif_item["value"] = annotation_item["value"]
                    classif_item["score"] = annotation_item["score"]
                    classif_item["user"] = annotation_item["user_id"]

                    if not label_item["name"] in excerpt_json["class_attributes"]["classification"] or is_curated:
                        excerpt_json["class_attributes"]["classification"][label_item["name"]] = classif_item
                    nb_classification += 1

                elif annotation_item["type"] == "labeling":
                    label_item = labels[annotation_item["label_id"]]
                    if label_item == None:
                        continue

                    labeling = {}
                    labeling["user"] = annotation_item["user_id"]
                    labeling["start"] = annotation_item["start"]
                    labeling["end"] = annotation_item["end"]
                    labeling["type"] = label_item["name"]
                    labeling["rawForm"] = annotation_item["rawForm"]
                    labeling["original_id"] = annotation_item["original_id"]
                    labeling["id"] = annotation_item["id"]

                    excerpt_json["entity_spans"].append(labeling)
                    nb_labeling += 1

            document_item["texts"].append(excerpt_json)
            nb_excepts += 1

        documents.append(document_item)
        nb_documents += 1

    corpus["dataset_name"] = dataset_item["name"]
    corpus["source"] = "KISH manual annotations" 
    current_date = datetime.now()
    corpus["export_date"] = current_date.isoformat()
    corpus["documents"] = documents

    # create a single json output with the shuffled document entries
    with open(export_path, 'w') as outfile:
        json.dump(corpus, outfile, indent=4)

    print("nb documents: ", str(nb_documents))
    print("nb excepts: ", str(nb_excepts))
    print("nb classifications: ", str(nb_classification))
    print("nb labeling: ", str(nb_labeling))

    return "success", nb_documents, nb_excepts, nb_classification, nb_labeling
