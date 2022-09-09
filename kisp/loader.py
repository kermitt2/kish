import ijson
import gzip
import kisp.db
from utils_db import insert_item, get_items, get_first_item, update_record

# note: ijson is used to stream json loading

async def import_dataset_json(dataset_id, path):
    '''
    Import JSON classification document and excerpts, possibily pre-classified and/or pre-labeled
    '''
    print("import..." + path + " in dataset " + dataset_id)

    nb_documents = 0
    nb_excepts = 0
    nb_classification = 0
    nb_labeling = 0

    # a map to cache existing labels defined in the dataset, avoid to make a SQL lookup at 
    # each occurence of the label
    local_labels = {}

    if path == None or len(path) == 0:
        return "path is empty", -1, -1, -1, -1

    if not path.endswith(".json") and not path.endswith(".json.gz"):
        return "invalid file extension", -1, -1, -1, -1

    if path.endswith(".gz"):
        f = gzip.open(path,'rb') 
    else:
        f = open(path, "rb")

    for record in ijson.items(f, "documents.item"):
        document_dict = {}
        if "full_text_url" in record:
            document_dict["pdf_uri"] = record["full_text_url"]
        if "doi" in record:
            document_dict["doi"] = record["doi"]
        if "pmc" in record:
            document_dict["pmc"] = record["pmc"]
        if "pmid" in record:
            document_dict["pmid"] = record["pmid"]
        document_id = await insert_item("document", document_dict)
        nb_documents += 1

        if "texts" not in record:
            continue

        #print(record["texts"])

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

            excerpt_id = await insert_item("excerpt", excerpt_dict)
            nb_excepts += 1

            # labeling
            if "entity_spans" in excerpt:
                for annotation in excerpt["entity_spans"]:
                    annotation_dict = {}
                    annotation_dict["excerpt_id"] = excerpt_id
                    annotation_dict["offset_start"] = annotation["start"]
                    annotation_dict["offset_end"] = annotation["end"]
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
                        check_label_id = await insert_item("label", check_label)
                        check_label["id"] = check_label_id
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
                        check_label_id = await insert_item("label", check_label)
                        check_label["id"] = check_label_id
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
