import io
import os
import yaml

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
