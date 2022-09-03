import json
import kisp.db

def import_classification_json(dataset_id, path):
    '''
    Import JSON classification excerpts, possibily pre-classified, into a task
    '''
    print("import..." + path + " in dataset " + dataset_id)
