import ijson
import json
import gzip
import kish.db
from utils_db import insert_item, get_items, get_first_item, update_record

# note: ijson is used to stream json loading

async def import_dataset_json(dataset_id: str, paths: list):
    '''
    Import JSON classification document and excerpts, possibily pre-classified and/or pre-labeled
    paths is a list of path to json files to be imported to the dataset (so a dataset can be provided in 
    several files). 
    Note: there is no shuffle of the documents or excerpts on the dataset right noe, so a shuffle needs 
    to be done on the JSON files prior loading.
    '''
    print("import... " + str(paths) + " in dataset " + dataset_id)

    nb_documents = 0
    nb_excepts = 0
    nb_classification = 0
    nb_labeling = 0

    # a map to cache existing labels defined in the dataset, avoid to make a SQL lookup at 
    # each occurence of the label
    local_labels = {}

    if paths == None or len(paths) == 0:
        return "path list is empty", -1, -1, -1, -1

    for path in paths:

        if path == None or len(path) == 0:
            print("path is empty, move to next one...")

        if not path.endswith(".json") and not path.endswith(".json.gz"):
            print("path has invalid file extension: " + path + ", move to next one...")

        if path.endswith(".gz"):
            f = gzip.open(path,'rb') 
        else:
            f = open(path, "rb")

        for record in ijson.items(f, "documents.item"):
            document_dict = {}
            if "full_text_url" in record:
                document_dict["pdf_url"] = record["full_text_url"]
            if "full_text_pdf_uri" in record:
                document_dict["pdf_uri"] = record["full_text_pdf_uri"]
            if "full_text_tei_uri" in record:
                document_dict["tei_uri"] = record["full_text_tei_uri"]
            if "doi" in record:
                document_dict["doi"] = record["doi"]
            if "pmc" in record:
                document_dict["pmc"] = record["pmc"]
            if "pmid" in record:
                document_dict["pmid"] = record["pmid"]
            document_item = await insert_item("document", document_dict)
            document_id = document_item["id"]

            await insert_item("incollection", {"document_id": document_id, "dataset_id": dataset_id}, add_id=False)

            nb_documents += 1

            if "texts" not in record:
                continue

            for excerpt in record["texts"]:
                excerpt_dict = {}
                excerpt_dict["document_id"] = document_id
                excerpt_dict["dataset_id"] = dataset_id
                excerpt_dict["text"] = excerpt["text"]
                if "full_context" in excerpt:
                    excerpt_dict["full_context"] = excerpt["full_context"]
                    position_text = excerpt["full_context"].index(excerpt["text"])
                    if position_text != -1:
                        excerpt_dict["offset_start"] = position_text
                        excerpt_dict["offset_end"] = position_text + len(excerpt["text"])

                excerpt_item = await insert_item("excerpt", excerpt_dict)
                excerpt_id = excerpt_item["id"]
                nb_excepts += 1

                # labeling
                if "entity_spans" in excerpt:
                    for annotation in excerpt["entity_spans"]:
                        annotation_dict = {}
                        annotation_dict["excerpt_id"] = excerpt_id
                        # offsets are always relative to the full context
                        annotation_dict["offset_start"] = annotation["start"]
                        annotation_dict["offset_end"] = annotation["end"]
                        if "offset_start" in excerpt_dict:
                            annotation_dict["offset_start"] += excerpt_dict["offset_start"]
                        if "offset_start" in excerpt_dict:
                            annotation_dict["offset_end"] += excerpt_dict["offset_start"]
                        annotation_dict["chunk"] = annotation["rawForm"]
                        annotation_dict["source"] = "automatic"
                        annotation_dict["type"] = "labeling"

                        if "id" in annotation:
                            annot_id = annotation["id"]
                            if annot_id.startswith("#"):
                                annot_id = annot_id[1:]
                            annotation_dict["original_id"] = annot_id

                        # do we already have this label defined?
                        check_label = await get_first_item("label", {"name": annotation["type"], "type": "labeling"})
                        if check_label == None:
                            # insert this new label
                            check_label = { "name": annotation["type"], "dataset_id": dataset_id, "type": "labeling" }
                            check_label_item = await insert_item("label", check_label)
                            check_label["id"] = check_label_item["id"]
                        annotation_dict["label_id"] = check_label["id"]

                        await insert_item("annotation", annotation_dict)
                        nb_labeling += 1

                # classification
                if "class_attributes" in excerpt and "classification" in excerpt["class_attributes"]:
                    for classification in excerpt["class_attributes"]["classification"]:
                        classification_dict = {}

                        classification_dict["excerpt_id"] = excerpt_id
                        
                        # do we already have this class defined?
                        check_label = await get_first_item("label", {"name": classification, "type": "classification"})
                        if check_label == None:
                            # insert this new label
                            check_label = { "name": classification, "dataset_id": dataset_id, "type": "classification" }
                            check_label_item = await insert_item("label", check_label)
                            check_label["id"] = check_label_item["id"]
                        classification_dict["label_id"] = check_label["id"]
                        classification_dict["source"] = "automatic"
                        classification_dict["value"] = excerpt["class_attributes"]["classification"][classification]["value"]
                        classification_dict["score"] = float(excerpt["class_attributes"]["classification"][classification]["score"])
                        classification_dict["type"] = "classification"

                        await insert_item("annotation", classification_dict)
                        nb_classification += 1

        f.close()

    # update dataset information
    dataset_dict = { "nb_documents": nb_documents, "nb_excerpts": nb_excepts }
    await update_record("dataset", dataset_id, dataset_dict)

    print("nb documents: ", str(nb_documents))
    print("nb excepts: ", str(nb_excepts))
    print("nb classifications: ", str(nb_classification))
    print("nb labeling: ", str(nb_labeling))

    return "success", nb_documents, nb_excepts, nb_classification, nb_labeling

async def import_labels_json(dataset_id: str, paths: list):
    '''
    Import a set of label/class definitions to be associated to a given dataset. The labels have a JSON structure
    giving the name of the label, a description, a html color and a type (classification or labeling).
    If a label is already associated to the dataset for the same type, the label is updated with the new information
    coming from this JSON file. 
    If a label is not associated to the dataset, it is added. 
    '''
    print("import... " + str(paths) + " in dataset " + dataset_id)

    nb_added_labels = 0
    nb_updated_labels = 0

    if paths == None or len(paths) == 0:
        return "path list is empty", -1, -1, -1, -1

    for path in paths:
        if path == None or len(path) == 0:
            print("path is empty, move to next one...")

        if not path.endswith(".json") and not path.endswith(".json.gz"):
            print("path has invalid file extension: " + path + ", move to next one...")

        if path.endswith(".gz"):
            f = gzip.open(path,'rt') 
        else:
            f = open(path, "rt")

        json_labels = f.read()
        try:
            jsonObject = json.loads(json_labels)
        except Exception as e:
            print("the json parsing of the following label definition file failed: ", path)
            print(e)
            continue

        if "labels" in jsonObject:
            for label in jsonObject["labels"]:
                if "type" not in label or label["type"] == None or len(label["type"]) == 0:
                    item = await get_first_item("label", {"dataset_id": dataset_id, "name": label_dict["name"]})
                else:
                    item = await get_first_item("label", {"dataset_id": dataset_id, "type": label["type"], "name": label["name"]})

                if item == None:
                    # not present, we add the label
                    from utils_db import insert_item
                    label["dataset_id"] = dataset_id
                    await insert_item("label", label, add_id=True)
                    nb_added_labels += 1
                else:
                    # label is already defined in the dataset, we update the fields 
                    to_update = False
                    for field in label:
                        if field == 'id': 
                            continue
                        if len(label[field])>0 and item[field] != label[field]:
                            item[field] = label[field]
                            to_update = True
                    if to_update:
                        record = await update_record("label", str(item["id"]), item)
                        nb_updated_labels += 1

    print("nb labels added: ", str(nb_added_labels))
    print("nb labels updates: ", str(nb_updated_labels))

    dataset_labels = await get_items("label", {})
    print("nb total labels in dataset:", str(len(dataset_labels)))
