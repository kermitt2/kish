from utils_db import insert_item, get_first_item, update_record, get_items

async def generate_tasks(dataset_id, task_type="classification", target_annotators=5, redundancy=2, labels=["created", "used", "shared"]):
    """
    For a given dataset and some specifications, create a list of tasks to be assigned or selected by users.
    Task can be of type "classification" or "labeling".
    The number of annotators is used to create a certain number of tasks, dividing the full dataset into
    smaller sets to be annotated.
    The redundancy parameter indicates by how many users the same task should be performed in order to allow 
    reconcialiation step/correction for disagreements and/or to produce Inter Annotator Agreement scores.
    A set of labels should also be provided (already existing in the dataset or no). 
    """
    nb_tasks = 0

    # get dataset information
    dataset = await get_first_item("dataset", { "id": dataset_id } )

    if not "nb_documents" in dataset or not "nb_excerpts" in dataset:
        return 0

    nb_document = dataset["nb_documents"]
    nb_excerpts = dataset["nb_excerpts"]
    nb_excerpts_per_task = (nb_excerpts // target_annotators) + 1
    nb_tasks = target_annotators

    print("nb_tasks: " + str(nb_tasks))
    print("nb_excerpts_per_task: " + str(nb_excerpts_per_task))

    for i in range(0,nb_tasks):
        # add redundancy
        primary_task_id = -1
        for j in range(0, redundancy):
            # create task
            task_dict = { "type": task_type, 
                          "dataset_id": dataset_id, 
                          "name": dataset["name"]+"-task"+str(i)+"-"+str(j) }
            if j != 0 and primary_task_id != -1:
                task_dict["redundant"] = primary_task_id
            task_id = await insert_item("task", task_dict)
            # update dataset
            dataset_dict = {}
            if "nb_tasks" in dataset and dataset["nb_tasks"] is not None:
                dataset_dict["nb_tasks"] = dataset["nb_tasks"] + 1
                dataset["nb_tasks"] += 1
            else:
                dataset_dict["nb_tasks"] = 1
                dataset["nb_tasks"] = 1
            await update_record("dataset", dataset_id, dataset_dict)
            if j == 0:
                primary_task_id = task_id

            # add excerpts to task
            offset_from = i * nb_excerpts_per_task
            offset_to = (i+1) * nb_excerpts_per_task
            local_excerpts = await get_items("excerpt", { "dataset_id": dataset_id }, offset_from=offset_from, offset_to=offset_to, full=True)

            if len(local_excerpts) == 0:
                continue

            for local_excerpt in local_excerpts:
                #print(local_excerpt)
                intask_dict = { "task_id": task_id, "excerpt_id": local_excerpt["id"] }
                await insert_item("intask", intask_dict, add_id=False)

    return nb_tasks


async def assign_user(task_id, user_id):
    """
    Assign a user to a task
    """
    assign_dict = { "task_id": task_id, "user_id": user_id, "in_progress": False, "completed_excerpts": 0 }
    result = await insert_item("assign", assign_dict, add_id=False)
    if result != None and "error" in result:
        return result
    else
        return

async def unassign_user(task_id, user_id):
    """
    Assign a user to a task
    """
    assign_dict = { "task_id": task_id, "user_id": user_id }
    result = await delete_items("assign", assign_dict)
    if result != None and "error" in result:
        return result
    else
        return

