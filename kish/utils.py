import io
import os
import yaml
import markdown 

global_config = None

def _load_config(config_file='./config.yaml'):
    """
    Load the json configuration, and keep a global instance available 
    """
    global global_config
    config = None
    if config_file and os.path.exists(config_file) and os.path.isfile(config_file):
        with open(config_file, 'r') as the_file:
            raw_configuration = the_file.read()
        try:
            configuration = yaml.safe_load(raw_configuration)
        except:
            # note: it appears complicated to get parse error details from the exception
            configuration = None

        if configuration == None:
            msg = "Error: yaml config file cannot be parsed: " + str(config_file)
            raise Exception(msg)
    else:
        msg = "Error: configuration file is not valid: " + str(config_file)
        raise Exception(msg)
    global_config = configuration

    return configuration

def deliver_markdown(filename):
    
    filepath = os.path.join("resources/data/markdown/", filename)
    print(filepath)
    text = None
    data = {}

    with open(filepath, "rt", encoding="utf-8") as input_file:
        text = input_file.read()

    if text != None and len(text)>0:
        html = markdown.markdown(text)
        data["text"] = html
        
    return data
