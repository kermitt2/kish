import json
from itertools import groupby
from operator import itemgetter
from utils_db import get_items, get_first_item, get_task_attributes 

def _round(value, decimals):
    return str(round(value, decimals))

async def compute_metrics(task_items):
    result = {}

    # percentage disagreement
    nb_cases = 0
    nb_completed_cases = 0
    nb_completed_distinct_cases = 0
    nb_disagreements = 0
    nb_max_disagreements = 0
    nb_min_disagreements = 1000000
    nb_tasks = len(task_items)
    nb_distinct_tasks = 0
    nb_completed_tasks = 0
    for task_item in task_items:
        nb_cases += task_item["nb_excerpts"]
        nb_completed_cases += task_item["nb_completed_excerpts"]

    if nb_cases == 0:
        result["progress"] = 0
    else:
        result["progress"] = nb_completed_cases / nb_cases
    
    primary_completed_tasks = []
    for task_item in task_items:
        if not "redundant" in task_item or task_item["redundant"] == None:
            nb_distinct_tasks += 1

        if task_item["type"] != "reconciliation":
            continue

        primary_completed_tasks.append(task_item["redundant"])
        nb_completed_tasks += 1

        excerpt_ids = await get_items("intask", { "task_id": task_item["id"] } )
        nb_local_disagreements = len(excerpt_ids)

        if nb_local_disagreements > nb_max_disagreements:
            nb_max_disagreements = nb_local_disagreements

        if nb_local_disagreements < nb_min_disagreements:
            nb_min_disagreements = nb_local_disagreements

        nb_disagreements += nb_local_disagreements

    for task_item in task_items:
        if task_item["id"] in primary_completed_tasks:
            excerpt_ids = await get_items("intask", { "task_id": task_item["id"] } )
            nb_completed_distinct_cases += len(excerpt_ids)

    result["nb_disagreements"] = nb_disagreements
    result["nb_max_disagreements"] = nb_max_disagreements
    if nb_min_disagreements != 1000000:
        result["nb_min_disagreements"] = nb_min_disagreements
    else:
        result["nb_min_disagreements"] = 0
    result["nb_distinct_tasks"] = nb_distinct_tasks
    result["nb_completed_distinct_cases"] = nb_completed_distinct_cases
    if nb_completed_distinct_cases == 0:
        result['percentage_agreement'] = 0
    else:
        result['percentage_agreement'] = 1 - (nb_disagreements / nb_completed_distinct_cases)
    result['nb_completed_tasks'] = nb_completed_tasks

    result['nb_total_cases'] = nb_cases
    result['nb_completed_cases'] = nb_completed_cases

    # Kohen's kappa coefficient (via NLTK)

    # Krippendorf's alpha coefficient (via NLTK)

    return result

async def compute_overall_metrics(dataset_id: str):
    # note: progress is calculated based on every tasks
    # IAA iscalculated based on completed tasks only

    # get dataset basic information
    dataset_item = await get_first_item("dataset", {"id": dataset_id})

    # get all tasks for all the task types
    task_items = await get_items("task", {"dataset_id": dataset_id}, full=True)
    task_items_reconciliation = await get_items("task", {"dataset_id": dataset_id, "type": "reconciliation"}, full=True)

    for task_item_reconciliation in task_items_reconciliation:
        # only keep reconciliation tasks corresponding to the given type task
        if task_item_reconciliation["type"] == "reconciliation" and "redundant" in task_item_reconciliation and task_item_reconciliation["redundant"] != None:
            primary_task = await get_first_item("task", { "id": task_item_reconciliation["redundant"] })
            #if primary_task["type"] == task_type:
            task_items.append(task_item_reconciliation)

    print("total tasks", str(len(task_items)))

    # number of documents, excerpts and annotations
    for task_item in task_items:
        task_attributes = await get_task_attributes(task_item)
        for key in task_attributes:
            task_item[key] = task_attributes[key]
    result_dict = await compute_metrics(task_items)

    # TBD: report IAA on labels individualy too

    # add dataset general information for practicality
    for key in dataset_item:
        result_dict[key] = dataset_item[key]

    return result_dict
