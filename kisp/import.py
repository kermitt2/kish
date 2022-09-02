import json
import kisp.db

def import_classification_json(task_id, path):
    '''
    Import JSON classification excerpts, possibily pre-classified, into a task
    '''
    print("import..." + path + " in task " + task_id)
