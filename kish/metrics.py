import json
from itertools import groupby
from operator import itemgetter
from utils_db import get_items, get_first_item, get_task_attributes 

def _round(value, decimals):
    return str(round(value, decimals))

def prepare_iaa_sequence_labeling(cumulated_object):
    from nltk import AnnotationTask
    annotators = sorted(cumulated_object['annotators'])
    formatted_blocks = []
    for block in cumulated_object['blocks']:
        continuum = block['paragraph']
        formatted_output = {'continuum': continuum, 'studies': {}}
        for annotator in annotators:
            annotations = block['annotations'][annotator]
            annotation_id = 0
            # if continuum == continuum[annot['start']:annot['end']]:
            # else:
            #
            out = ['o' for i in continuum]
            for i, c in enumerate(continuum):
                annot = annotations[annotation_id]
                if annot['start'] <= i < annot['end']:
                    if annot['start'] == i:
                        out[i] = 'Bs'
                    else:
                        out[i] = 's'
                elif i == annot['end']:
                    if annotation_id < len(annotations) - 1:
                        annotation_id += 1
            formatted_output['studies'][annotator] = out
        formatted_blocks.append(formatted_output)

    # Formatting as triples with (coder, item, label)

    annotation_tasks = []
    for block in formatted_blocks:
        continuum = block['continuum']
        output = []
        for i in range(0, len(continuum)):
            for annotator in annotators:
                output.append((annotator, i, block['studies'][annotator][i]))

        a = AnnotationTask(data=output)
        annotation_tasks.append(a)

    return annotation_tasks

def prepare_iaa_classification(cumulated_object):
    from nltk import AnnotationTask
    annotators = sorted(cumulated_object['annotators'])
    formatted_blocks = []
    for block in cumulated_object['blocks']:
        continuum = block['paragraph']
        formatted_output = {'continuum': continuum, 'studies': {}}
        for annotator in annotators:
            annotations = block['annotations'][annotator]
            annotation_id = 0
            # if continuum == continuum[annot['start']:annot['end']]:
            # else:
            #
            out = ['o' for i in continuum]
            for i, c in enumerate(continuum):
                annot = annotations[annotation_id]
                if annot['start'] <= i < annot['end']:
                    if annot['start'] == i:
                        out[i] = 'Bs'
                    else:
                        out[i] = 's'
                elif i == annot['end']:
                    if annotation_id < len(annotations) - 1:
                        annotation_id += 1
            formatted_output['studies'][annotator] = out
        formatted_blocks.append(formatted_output)

    # Formatting as triples with (coder, item, label)

    annotation_tasks = []
    for block in formatted_blocks:
        continuum = block['continuum']
        output = []
        for i in range(0, len(continuum)):
            for annotator in annotators:
                output.append((annotator, i, block['studies'][annotator][i]))

        a = AnnotationTask(data=output)
        annotation_tasks.append(a)

    return annotation_tasks

async def compute_metrics(task_items):
    result = {}

    # percentage disagreement
    nb_cases = 0
    nb_completed_cases = 0
    nb_disagreements = 0
    nb_max_disagreements = 0
    nb_min_disagreements = 1000000
    nb_tasks = len(task_items)
    nb_distinct_tasks = 0
    for task_item in task_items:
        nb_cases += task_item["nb_excerpts"]
        nb_completed_cases += task_item["nb_completed_excerpts"]

    result["progress"] = nb_completed_cases / nb_cases
    
    for task_item in task_items:
        print(task_item)

        if task_item["type"] != "reconciliation":
            continue
    
        excerpt_ids = await get_items("intask", { "task_id": task_item["id"] } )
        nb_local_disagreements = len(excerpt_ids)

        if nb_local_disagreements > nb_max_disagreements:
            nb_max_disagreements = nb_local_disagreements

        if nb_local_disagreements < nb_min_disagreements:
            nb_min_disagreements = nb_local_disagreements

        nb_disagreements += nb_local_disagreements

    result["nb_disagreements"] = nb_disagreements
    result["nb_max_disagreements"] = nb_max_disagreements
    if nb_min_disagreements != 1000000:
        result["nb_min_disagreements"] = nb_min_disagreements
    else 
        result["nb_min_disagreements"] = 0
    
    # Kohen's kappa coefficient

    # Krippendorf's alpha coefficient

    return result

async def compute_overall_metrics(dataset_id: str, task_type: str):
    # note: progress is calculated based on every tasks
    # IAA iscalculated based on completed tasks only

    # get dataset basic information
    dataset_item = await get_first_item("dataset", {"id": dataset_id})

    # get all tasks for the task type
    task_items = await get_items("task", {"dataset_id": dataset_id, "type": task_type}, full=True)
    task_items_reconciliation = await get_items("task", {"dataset_id": dataset_id, "type": "reconciliation"}, full=True)

    for task_item_reconciliation in task_items_reconciliation:
        # only keep reconciliation tasks corresponding to the given type task
        if task_item_reconciliation["type"] == "reconciliation" and "redundant" in task_item_reconciliation and task_item_reconciliation["redundant"] != None:
            primary_task = await get_first_item("task", { "id": task_item_reconciliation["redundant"] })
            if primary_task["type"] == task_type:
                task_items.append(task_item_reconciliation)

    print("total tasks", str(len(task_items)))

    # number of documents, excerpts and annotations
    for task_item in task_items:
        task_attributes = await get_task_attributes(task_item)
        for key in task_attributes:
            task_item[key] = task_attributes[key]
    result_dict = await compute_metrics(task_items)

    # TBD: report IAA on labels individualy too

    return result_dict
