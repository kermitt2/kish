import io
import os
import yaml
import markdown 
import smtplib
from email.message import EmailMessage
import ssl

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

def send_pwd_reset_email(email_dest: str, token: str):
    """
    At this point, config must be loaded
    """
    msg = EmailMessage()

    # load template from file
    msg_content = None
    with open("resources/data/templates/reset_email.txt") as fp:
        msg_content = fp.read()

    # add tmp token for the user
    if msg_content == None:
        print("Empty reset email template, cannot create email message")
        print("abording reset...")
        return
    else:
        new_pwd_link = global_config["smtp"]["app_domain"] + "/new-pwd.html?token="+token
        msg_content = msg_content.replace("{{NEW_PWD_LINK}}", new_pwd_link)
        msg_content = msg_content.replace("{{LIFETIME}}", str(global_config["api"]["lifetime"]))
        reset_link = global_config["smtp"]["app_domain"] + "/reset-pwd.html"
        msg_content = msg_content.replace("{{RESET_LINK}}", reset_link)

    msg.set_content(msg_content);

    msg["Subject"] = "Reset password for KISH app"
    msg["From"] = global_config["smtp"]["account"]
    msg['To'] = email_dest

    if str(global_config["smtp"]["port"]) == "587":
        # the more standard STARTTLS is used  

        # Send the message via a secured SMTP server.
        smtp = smtplib.SMTP(host=global_config["smtp"]["host"], port=587)

        # send extended hello to the smtp server
        smtp.ehlo()

        # use TLS encryption
        smtp.starttls()  

        # login to the smtp server
        smtp.login(global_config["smtp"]["account"], global_config["smtp"]["pwd"])  
    else:
        # not so sure how to cover every cases, although the above STARTTLS should be used 
        # most of the time
        if str(global_config["smtp"]["port"]) == "465":
            # it should be SSL 
            # create a secure SSL context
            context = ssl.create_default_context()

            smtp = smtplib.SMTP_SSL(host=global_config["smtp"]["host"], port=465, context=context)
            smtp.login(global_config["smtp"]["account"], global_config["smtp"]["pwd"])
        else:
            smtp = smtplib.SMTP(host=global_config["smtp"]["host"], port=global_config["smtp"]["port"])
            smtp.login(global_config["smtp"]["account"], global_config["smtp"]["pwd"])

    smtp.send_message(msg)
    smtp.quit()
