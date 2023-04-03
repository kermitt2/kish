from utils_db import insert_item, get_first_item, update_record, get_items, row2dict
import subprocess
import json 

async def generate_tasks(dataset_id, 
                        task_group_name, 
                        task_type="classification", 
                        target_annotators=5, 
                        redundancy=2, 
                        max_task_size=50, 
                        max_task_number=20, 
                        guidelines=None):
    """
    For a given dataset and some specifications, create a list of tasks to be assigned or selected by users
    at the level of excerpt.
    
    Task can be of type "classification" or "labeling".
    
    The number of annotators is used to create a certain number of tasks, dividing the full dataset into
    smaller sets to be annotated.
    
    The maximum size of a task is bounded by a parameter too. 
    
    The redundancy parameter indicates by how many users the same task should be performed in order to allow 
    reconcialiation step/correction for disagreements and/or to produce Inter Annotator Agreement scores.
    
    The path to the annotation guidelines associated to the generated tasks can also be specified here as
    additional argument.

    Here, the level of input to be annotated in the task is "excerpt". We show excerpt one after the other
    to the user for annotations. 
    """
    nb_tasks = 0

    # get dataset information
    dataset = await get_first_item("dataset", { "id": dataset_id } )

    if not "nb_documents" in dataset or not "nb_excerpts" in dataset:
        return 0

    nb_document = dataset["nb_documents"]
    nb_excerpts = dataset["nb_excerpts"]

    # to determine task size, we check which criteria between number of annotators (first) 
    # and max_task_size (second) should apply
    nb_excerpts_per_task = (nb_excerpts // target_annotators) + 1
    if nb_excerpts_per_task > max_task_size:
        # we sub-partition
        divider = (nb_excerpts // max_task_size) + 1
        nb_tasks = divider
        nb_excerpts_per_task = (nb_excerpts // nb_tasks) + 1
    else:
        nb_tasks = target_annotators

    if nb_tasks > max_task_number:
        nb_tasks = max_task_number

    print("nb_tasks: " + str(nb_tasks))
    print("nb_excerpts_per_task: " + str(nb_excerpts_per_task))

    for i in range(0,nb_tasks):
        # add redundancy
        primary_task_id = -1
        for j in range(0, redundancy):
            # create task
            task_dict = { "type": task_type, 
                          "dataset_id": dataset_id, 
                          "name": dataset["name"]+"-"+task_group_name+"-task"+str(i)+"-"+str(j),
                          "guidelines": guidelines,
                          "level": "excerpt" }
            if j != 0 and primary_task_id != -1:
                task_dict["redundant"] = primary_task_id

            # prepare excerpts to task
            offset_from = i * nb_excerpts_per_task
            offset_to = (i+1) * nb_excerpts_per_task
            local_excerpts = await get_items("excerpt", { "dataset_id": dataset_id }, offset_from=offset_from, offset_to=offset_to, full=True)

            if len(local_excerpts) == 0:
                continue

            task_item = await insert_item("task", task_dict)
            task_id = task_item["id"]
            
            if j == 0: 
                primary_task_id = task_id

            # update dataset
            dataset_dict = {}
            if "nb_tasks" in dataset and dataset["nb_tasks"] is not None:
                dataset_dict["nb_tasks"] = dataset["nb_tasks"] + 1
                dataset["nb_tasks"] += 1
            else:
                dataset_dict["nb_tasks"] = 1
                dataset["nb_tasks"] = 1
            await update_record("dataset", dataset_id, dataset_dict)

            for local_excerpt in local_excerpts:
                #print(local_excerpt)
                intask_dict = { "task_id": task_id, "excerpt_id": local_excerpt["id"], "document_id": local_excerpt["document_id"], "validated": False, "ignored": False }
                await insert_item("intask", intask_dict, add_id=False)

    return nb_tasks


async def assign_user(task_id, user_id):
    """
    Assign a user to a task
    """
    assign_dict = { "task_id": task_id, "user_id": user_id, "in_progress": 0, "is_completed": 0, "completed_excerpts": 0 }
    result = await insert_item("assign", assign_dict, add_id=False)
    if result != None and "error" in result:
        return result
    else:
        return

async def unassign_user(task_id, user_id):
    """
    Assign a user to a task
    """
    assign_dict = { "task_id": task_id, "user_id": user_id }
    result = await delete_items("assign", assign_dict)
    if result != None and "error" in result:
        return result
    else:
        return

async def has_reconciliation_task(task_id):
    # check if we have already a reconciliation task for the given task

    # retrieve task info
    task_item = await get_first_item("task", { "id": task_id} )

    # if the task is itself a reconciliation task
    if task_item["type"] == "reconciliation":
        return True

    ind = task_item["name"].rindex("-")
    reconciliation_task_name = task_item["name"][:ind]
    reconciliation_task_item = await get_first_item("task", { "name": reconciliation_task_name} )
    if reconciliation_task_item != None:
        return True
    else:
        return False

async def check_completed_tasks(task_id):
    """
    Check if all redundant tasks are complete for the given task.
    If we have at least one redundant task, and they are complete, return True,
    otherwise False.
    If the task is not redundant, return False. 
    """

    # retrieve task info
    task_item = await get_first_item("task", { "id": task_id} )

    if "redundant" not in task_item or task_item["redundant"] == None:
        primary_task_id = task_id
    else:
        primary_task_id = task_item["redundant"]

    # check primary task
    if primary_task_id == task_id:
        primary_task_item = task_item
    else:
        primary_task_item = await get_first_item("task", { "id": primary_task_id} )
    assignment_item = await get_first_item("assign", { "task_id": primary_task_id} )
    if assignment_item == None or not assignment_item["is_completed"]:
        return False

    # check redundant tasks    
    redundant_tasks_ids = await get_items("task", { "redundant": primary_task_id})
    if redundant_tasks_ids == None or len(redundant_tasks_ids) == 0:
        # no redundant task
        return False

    for redundant_tasks_id in redundant_tasks_ids:
        assignment_item = await get_first_item("assign", { "task_id": redundant_tasks_id} )
        if assignment_item == None:
            # redundant task is not assigned, so not completed
            return False
        if not assignment_item["is_completed"]:
            return False

    # at least one redundant task, and they are all complete
    return True

async def open_reconciliation_task(task_id):
    """
    Create a reconciliation task based on all completed redundant tasks for a given task
    """

    # retrieve task info
    task_item = await get_first_item("task", { "id": task_id} )

    # if the task is itself a reconciliation task, nothing to do
    if task_item["type"] == "reconciliation":
        return False

    if "redundant" not in task_item or task_item["redundant"] == None:
        primary_task_id = task_id
    else:
        primary_task_id = task_item["redundant"]

    # retrieve full list of redundant tasks
    task_items = await get_items("task", { "redundant": primary_task_id} )
    if task_id not in task_items:
        task_items.append(task_id)
    if primary_task_id not in task_items:
        task_items.append(primary_task_id)

    # retrieve dataset info
    dataset_item = await get_first_item("dataset", { "id": task_item["dataset_id"]} )

    ind = task_item["name"].rindex("-")
    reconciliation_task_name = task_item["name"][:ind]

    reconciliation_task_dict = { "type": "reconciliation", 
                  "dataset_id": task_item["dataset_id"], 
                  "name": reconciliation_task_name,
                  "redundant": primary_task_id,
                  "guidelines": task_item["guidelines"],
                  "level": task_item["level"] }
    reconciliation_task_response = await insert_item("task", reconciliation_task_dict, add_id=True)
    reconciliation_task_id = reconciliation_task_response["id"]
    reconciliation_task_dict["id"] = reconciliation_task_id

    if task_item["level"] == "document":
        # only put documents with disagreements in this task
        intask_documents = await get_items("intask", { "task_id": primary_task_id})

        documents_to_reconciliate = []
        excerpts_to_reconciliate = []
        annotations_to_reconciliate = []
        map_excerpt_to_document = {}
        
        # for each document, get first all the annotated excerpts for the redundant tasks, check for disagreement
        for intask_document in intask_documents:            
            document_id = intask_document["document_id"]
            print("document_id:", document_id)
            
            # give all the excerpts of document_id
            all_document_excerpts = []

            except_number = -1
            for task_id in task_items:
                document_excerpts = await get_items("intask", { "document_id": document_id, "task_id": task_id }, full=True)

                if document_excerpts == None:
                    continue

                # check with other task excerpts
                for other_task_id in task_items:
                    if other_task_id == task_id:
                        continue
                    other_document_excerpts = await get_items("intask", { "document_id": document_id, "task_id": other_task_id }, full=True)
                    if other_document_excerpts == None:
                        continue

                    other_document_excerpts_ids = []
                    for other_document_excerpt in other_document_excerpts:
                        other_document_excerpts_ids.append(other_document_excerpt["excerpt_id"])

                    for document_excerpt in document_excerpts:
                        if document_excerpt["excerpt_id"] == None:
                            continue

                        if not document_excerpt["excerpt_id"] in other_document_excerpts_ids:
                            print(document_excerpt["excerpt_id"], "not in", other_document_excerpts_ids)
                            if document_id not in documents_to_reconciliate:
                                documents_to_reconciliate.append(document_id)
                            if document_excerpt["excerpt_id"] not in excerpts_to_reconciliate:
                                excerpts_to_reconciliate.append(document_excerpt["excerpt_id"])
                                map_excerpt_to_document[document_excerpt["excerpt_id"]] = document_id

                                excerpts_annotation_items = await get_items("annotation", { 
                                    "task_id": task_id, 
                                    "excerpt_id": document_excerpt["excerpt_id"] }, full=True)

                                for excerpts_annotation_item in excerpts_annotation_items:
                                    # ignore automatic pre-labeling
                                    if "user_id" not in excerpts_annotation_item or excerpts_annotation_item["user_id"] == None:
                                        continue
                                    # add the other annotations
                                    excerpts_annotation_item["task_id"] = reconciliation_task_id
                                    annotations_to_reconciliate.append(excerpts_annotation_item)
    
        print("documents_to_reconciliate:", str(len(documents_to_reconciliate)))
        for document_to_reconciliate in documents_to_reconciliate:
            # add document to the reconciliation task
            reconciliation_intask_dict = { "task_id": reconciliation_task_id, "document_id": document_to_reconciliate, "validated": 0, "ignored": 0 }
            await insert_item("intask", reconciliation_intask_dict, add_id=False)

        print("excerpts_to_reconciliate:", str(len(excerpts_to_reconciliate)))
        for excerpt_to_reconciliate in excerpts_to_reconciliate:
            # add excerpt to the reconciliation task
            reconciliation_intask_dict = { "task_id": reconciliation_task_id, "document_id": map_excerpt_to_document[excerpt_to_reconciliate], "excerpt_id": excerpt_to_reconciliate, "validated": 0, "ignored": 0 }
            print(reconciliation_intask_dict)
            await insert_item("intask", reconciliation_intask_dict, add_id=False)    

        print("annotations_to_reconciliate:", str(len(annotations_to_reconciliate)))
        for annotation_to_reconciliate in annotations_to_reconciliate:
            del annotation_to_reconciliate["id"]
            del annotation_to_reconciliate["user_id"]
            await insert_item("annotation", annotation_to_reconciliate, add_id=True)

    else: 
        # excerpt level annotation, so only put excerpts with disagreements in this task, which is simpler
        intask_excerpts = await get_items("intask", { "task_id": primary_task_id})

        # for each excerpt, get all annotation for the redundant tasks, check for disagreement
        for intask_excerpt in intask_excerpts:
            excerpt_id = intask_excerpt["excerpt_id"]

            excepts_annotation_items = await get_items("annotation", { "excerpt_id": excerpt_id }, full=True)

            # map a label to its values, to identify easily disagrement across excerpt annotations
            labelValueMap = {}

            for excepts_annotation_item in excepts_annotation_items:

                # annotation must be in task_items (all redundant tasks) and 
                # have a valid user (not pre-annotation from automatic upload)
                if excepts_annotation_item["task_id"] not in task_items:
                    continue

                if "user_id" not in excepts_annotation_item or excepts_annotation_item["user_id"] == None:
                    continue

                # store label/chunk value for this annotation

                # init excerpt map for this label
                if excepts_annotation_item["label_id"] not in labelValueMap:
                    labelValueMap[excepts_annotation_item["label_id"]] = []

                # classification value
                if "value" in excepts_annotation_item and excepts_annotation_item["value"] != None:
                    if excepts_annotation_item["value"] not in labelValueMap[excepts_annotation_item["label_id"]]:
                        labelValueMap[excepts_annotation_item["label_id"]].append(excepts_annotation_item["value"])
                
                # if ignored
                if "ignored" in excepts_annotation_item and excepts_annotation_item["ignored"]:
                    if "ignored" not in labelValueMap[excepts_annotation_item["label_id"]]:
                        labelValueMap[excepts_annotation_item["label_id"]].append("ignored")

                # chunk labeling value
                if "chunk" in excepts_annotation_item and excepts_annotation_item["chunk"] is not None:
                    if excepts_annotation_item["chunk"] not in labelValueMap[excepts_annotation_item["label_id"]]:
                        labelValueMap[excepts_annotation_item["label_id"]].append(excepts_annotation_item["chunk"])

            # if disagreement for the value of a same label id, add the excerpt to the reconciliation task
            for label_id in labelValueMap:
                #print(labelValueMap[label_id])
                if len(labelValueMap[label_id]) > 1:
                    intask_dict = { "task_id": reconciliation_task_id, 
                                    "excerpt_id": excerpt_id, 
                                    "document_id": intask_excerpt["document_id"], 
                                    "validated": False }
                    await insert_item("intask", intask_dict, add_id=False)
                    break
    return True

async def generate_document_tasks(dataset_id, 
                                task_group_name, 
                                task_type="classification", 
                                target_annotators=5, 
                                redundancy=2, 
                                max_task_size=50, 
                                max_task_number=20, 
                                guidelines=None):
    """
    For a given dataset and some specifications, create a list of document-level tasks to be assigned or selected by users.
    
    Task can be of type "classification" or "labeling".
    
    The number of annotators is used to create a certain number of tasks, dividing the full dataset into
    smaller sets to be annotated.
    
    The maximum size of a task is bounded by a parameter too. 
    
    The redundancy parameter indicates by how many users the same task should be performed in order to allow 
    reconcialiation step/correction for disagreements and/or to produce Inter Annotator Agreement scores.
    
    The path to the annotation guidelines associated to the generated tasks can also be specified here as
    additional argument.

    The level of input to be presented to the user here is the document. This level supposes that the documents
    specified in the task include a PDF and a TEI XML URI for display. 
    """
    nb_tasks = 0

    # get dataset information
    dataset = await get_first_item("dataset", { "id": dataset_id } )

    if not "nb_documents" in dataset or not "nb_excerpts" in dataset:
        return 0

    nb_documents = dataset["nb_documents"]

    # to determine task size, we check which criteria between number of annotators (first) 
    # and max_task_size (second) should apply
    nb_documents_per_task = (nb_documents // target_annotators) + 1
    if nb_documents_per_task > max_task_size:
        # we sub-partition
        divider = (nb_documents // max_task_size) + 1
        nb_tasks = divider
        nb_documents_per_task = (nb_documents // nb_tasks) + 1
    else:
        nb_tasks = target_annotators

    if nb_tasks > max_task_number:
        nb_tasks = max_task_number

    print("nb_tasks: " + str(nb_tasks))
    print("nb_documents_per_task: " + str(nb_documents_per_task))

    for i in range(0,nb_tasks):
        # add redundancy
        primary_task_id = -1
        for j in range(0, redundancy):
            # create task
            task_dict = { "type": task_type, 
                          "dataset_id": dataset_id, 
                          "name": dataset["name"]+"-"+task_group_name+"-task"+str(i)+"-"+str(j),
                          "guidelines": guidelines,
                          "level": "document" }
            if j != 0 and primary_task_id != -1:
                task_dict["redundant"] = primary_task_id

            task_item = await insert_item("task", task_dict)
            task_id = task_item["id"]
            
            if j == 0: 
                primary_task_id = task_id

            # prepare documents for the task
            offset_from = i * nb_documents_per_task
            offset_to = (i+1) * nb_documents_per_task
            local_documents = await get_items("InCollection", { "dataset_id": dataset_id }, offset_from=offset_from, offset_to=offset_to, full=True)

            # update dataset
            dataset_dict = {}
            if "nb_tasks" in dataset and dataset["nb_tasks"] is not None:
                dataset_dict["nb_tasks"] = dataset["nb_tasks"] + 1
                dataset["nb_tasks"] += 1
            else:
                dataset_dict["nb_tasks"] = 1
                dataset["nb_tasks"] = 1
            await update_record("dataset", dataset_id, dataset_dict)

            for local_document in local_documents:
                #print(local_document)
                intask_dict = { "task_id": task_id, "document_id": local_document["document_id"], "validated": False, "ignored": False }
                await insert_item("intask", intask_dict, add_id=False)

    return nb_tasks

