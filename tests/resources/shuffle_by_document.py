import os
import json
import gzip
import random
import argparse

"""
Shuffle the documents present in a list of json files
"""

def shuffle(paths: list, output_path: str):

    # build first the list of documents from the different files
    # note: ijson can be used but to scale (here we we would need to write each documet json in a temp file
    # and then assemble them after shuffle)
    documents = []

    if paths == None or len(paths) == 0:
        return "path list is empty", -1, -1, -1, -1

    for path in paths:

        if path == None or len(path) == 0:
            print("path is empty, move to next one...")

        if not path.endswith(".json") and not path.endswith(".json.gz"):
            print("path has invalid file extension: " + path + ", move to next one...")

        if path.endswith(".gz"):
            f = gzip.open(path,'rb')
        else:
            f = open(path, "rb")

        corpus = json.load(f)

        for document in corpus["documents"]:
            if "texts" not in document:
                continue

            if len(document["texts"]) == 0:
                continue

            documents.append(document)

        f.close()

    # shuffle list of documents
    random.shuffle(documents)

    new_corpus = {}
    new_corpus["documents"] = documents

    # create a single json output with the shuffled document entries
    with open(output_path, 'w') as outfile:
        json.dump(new_corpus, outfile, indent=4)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description = "Filter labeled dataset for software mention context classification")

    parser.add_argument('-j','--json', nargs='+', help='path to the JSON labeled mention context corpus files', required=True)
    parser.add_argument("--output", type=str, 
        help="path where to generate the filtered software context classification dataset JSON file")

    args = parser.parse_args()
    json_files = args.json
    output_path = args.output

    # check path and call methods
    for json_file in json_files:
        if json_file is None or not os.path.isfile(json_file):
            print("error: the path to one of the JSON corpus files is not valid: ", json_file)
            exit(0)

    shuffle(json_files, output_path)
