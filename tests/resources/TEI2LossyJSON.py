"""
    Convert the rich, unambiguous, standard, generic, extendable TEI XML format of GROBID and Pub2TEI into 
    something similar to CORD-19 degraded JSON format (let's call it a working format)

    Original version: https://github.com/howisonlab/softcite-dataset/blob/master/code/corpus/TEI2LossyJSON.py
"""

import argparse
import json
import ntpath
import os
import xml
from collections import OrderedDict
from xml.sax import make_parser
import argparse
import json
import ntpath
import os
import xml
from collections import OrderedDict
from xml.sax import make_parser


class TEIContentHandler(xml.sax.ContentHandler):
    """ 
    TEI XML SAX handler for reading sections/paragraph with mixed content within xml text tags  
    """

    # local paragraph
    section = None
    #paragraph = None
    sentence = None
    ref_spans = None
    formula_spans = None
    list_spans = None

    # working variables
    accumulated = ''
    currentOffset = -1
    abstract = False
    current_reference = None
    current_item_list = None
    current_formula = None
    skip = False
    is_footnote = False
    in_head_section = False
    current_sentence_id = None 
    current_sentence_coordinates = None

    # dict corresponding to the converted json document
    document = None

    def __init__(self):
        xml.sax.ContentHandler.__init__(self)

    def startElement(self, name, attrs):
        if self.accumulated != '' and not self.in_head_section:
            #if self.paragraph == None:
            #    self.paragraph = ''
            if self.sentence == None:
                self.sentence = ''
            #self.paragraph += self.accumulated
            self.sentence += self.accumulated
            self.currentOffset += len(self.accumulated)
            if self.current_reference is not None:
                if 'text' in self.current_reference:
                    self.current_reference['text'] = self.current_reference['text'] + self.accumulated
                else:
                    self.current_reference['text'] = self.accumulated
        elif self.accumulated != '':
            if self.section is None:
                self.section = ''
            self.section += self.accumulated 
            self.currentOffset += len(self.accumulated)

        if name == 'TEI' or name == 'tei':
            # beginning of a document, reinit all
            self.section = None
            #self.paragraph = None
            self.sentence = None
            self.current_reference = None
            self.current_item_list = None
            self.current_formula = None
            self.document = OrderedDict()
            # default lang set here
            self.document["lang"] = "en"
            #self.document["level"] = "paragraph"
            self.document["level"] = "sentence"
            self.accumulated = ''
            self.abstract = False
            self.is_footnote = False
            self.in_head_section = False
            # usually NLM/Pub2TEI put the lang attribue at <TEI> when available
            if attrs.getLength() != 0:
                if "xml:lang" in attrs:
                    self.document["lang"] = attrs.getValue("xml:lang")
                    self.document.move_to_end('lang', last=False)
        if name == 'teiHeader':
            # GROBID produces a lang attribute at general level at the <teiHeader> and <text> elements
            if attrs.getLength() != 0:
                if "xml:lang" in attrs:
                    self.document["lang"] = attrs.getValue("xml:lang")
                    self.document.move_to_end('lang', last=False)
        elif name == "abstract":
            self.abstract = True
            self.document["abstract"] = []
            self.ref_spans = None
            self.formula_spans = None
            self.list_spans = None
        elif name == "head":
            # beginning of paragraph
            self.section = ''
            self.in_head_section = True
            self.ref_spans = None
            self.currentOffset = 0
        elif name == "p":
            # beginning of paragraph
            self.sentence = ''
            self.ref_spans = None
            self.formula_spans = None
            self.list_spans = None
            self.currentOffset = 0
        elif name == "s" or name == 'figDesc':
            # beginning of sentence
            self.sentence = ''
            self.ref_spans = None
            self.formula_spans = None
            self.list_spans = None
            self.currentOffset = 0
            if attrs.getLength() != 0:
                if "xml:id" in attrs:
                    self.current_sentence_id = attrs.getValue("xml:id")
                if "coords" in attrs:
                    self.current_sentence_coordinates = []
                    coordinate_string = attrs.getValue("coords")
                    pieces = coordinate_string.split(";")
                    for piece in pieces:
                        current_box = {}
                        fields = piece.split(",")
                        if len(fields) != 5:
                            continue
                        current_box["p"] = fields[0]
                        current_box["x"] = fields[1]
                        current_box["y"] = fields[2]
                        current_box["w"] = fields[3]
                        current_box["h"] = fields[4]
                        self.current_sentence_coordinates.append(current_box)

        elif name == "note": 
            # footnotes will be considered as paragraphs, others are not relevant (in header or reference section)
            self.is_footnote = False
            if attrs.getLength() != 0:
                if "place" in attrs and attrs.getValue("place") == 'foot':
                    # beginning of paragraph
                    #self.paragraph = ''
                    self.sentence = ''
                    self.ref_spans = None
                    self.formula_spans = None
                    self.list_spans = None
                    self.currentOffset = 0
                    self.is_footnote = True
        elif name == "ref":
            if attrs.getLength() != 0:
                if "type" in attrs:
                    self.current_reference = OrderedDict()
                    self.current_reference["type"] = attrs.getValue("type")
                    #if "target" in attrs:
                    #    if attrs.getValue("target") is not None:
                    #        self.current_reference["ref_id"] = attrs.getValue("target").replace("#", "")
                    self.current_reference["start"] = self.currentOffset
        elif name == "body":
            self.document["body_text"] = []
        elif name == 'list':
            self.list_spans = []
            '''
            if self.paragraph == None:
                self.paragraph = '\n'
            else:
                self.paragraph += '\n'
            '''
            '''
            if self.sentence == None:
                self.sentence = '\n'
            else:
                self.sentence += '\n'
            self.currentOffset += 1    
            '''
        elif name == 'item' or name == 'label':
            self.current_item_list = OrderedDict()
            self.current_item_list["start"] = self.currentOffset
            self.current_item_list["type"] = name
        elif name == 'formula':
            self.current_formula = OrderedDict()
            '''
            if self.paragraph == None:
                self.currentOffset = 0
            '''
            if self.sentence == None:
                self.currentOffset = 0
            self.current_formula["start"] = self.currentOffset
        else:
            self.skip = True

        self.accumulated = ''

    def endElement(self, name):
        if name == "head":
            if self.section is None:
                self.section = ''
            self.section += self.accumulated
            #local_paragraph = OrderedDict()
            #local_paragraph['text'] = self.section

            local_sentence = OrderedDict()
            local_sentence['text'] = self.section
            
            if self.ref_spans is not None and len(self.ref_spans) > 0:
                local_sentence['ref_spans'] = self.ref_spans

            if _is_not_empty(local_sentence['text']):
                if self.abstract:
                    self.document["abstract"].append(local_sentence)
                elif "body_text" in self.document:
                    self.document["body_text"].append(local_sentence)

            # Validating the reference offsets
            if self.ref_spans is not None and _is_not_empty(self.section):
                for reference in self.ref_spans:
                    if self.section[reference["start"]:reference["end"]] != reference['text']:
                        print("The reference " + reference['text']
                              + " offsets are not matching in section title '" + self.section + "'. The offsets correspond to "
                              + self.section[reference["start"]:reference["end"]])
                        print(local_sentence)

            self.ref_spans = None
            self.in_head_section = False

        elif name == 'div':
            self.section = None
        elif name == "hi":
            if self.in_head_section:
                if self.section is None:
                    self.section = self.accumulated
                else:
                    self.section += self.accumulated
            else:
                '''
                if self.paragraph == None:
                    self.paragraph = ''
                self.paragraph += self.accumulated
                '''
                if self.sentence == None:
                    self.sentence = ''
                self.sentence += self.accumulated
            if self.current_reference is not None:
                if 'text' in self.current_reference:
                    self.current_reference['text'] = self.current_reference['text'] + self.accumulated
                else:
                    self.current_reference['text'] = self.accumulated
        elif name == "s" or name == 'figDesc' or (name == 'note' and self.is_footnote):
            # end of sentence
            if self.sentence == None:
                self.sentence = ''
            self.sentence += self.accumulated

            local_sentence = OrderedDict()
            if self.section is not None:
                local_sentence['section'] = self.section
            local_sentence['text'] = self.sentence
            if self.current_sentence_id != None:
                local_sentence['id'] = self.current_sentence_id
            if self.current_sentence_coordinates != None:
                local_sentence['boundingBoxes'] = self.current_sentence_coordinates

            if self.ref_spans is not None and len(self.ref_spans) > 0:
                local_sentence['ref_spans'] = self.ref_spans
            if self.list_spans is not None and len(self.list_spans) > 0:
                local_sentence['list_spans'] = self.list_spans
            if self.formula_spans is not None and len(self.formula_spans) > 0:
                local_sentence['formula_spans'] = self.formula_spans

            if _is_not_empty(local_sentence['text']):
                if self.abstract:
                    self.document["abstract"].append(local_sentence)
                elif "body_text" in self.document:
                    self.document["body_text"].append(local_sentence)

            # Validating the reference offsets
            if self.ref_spans is not None and _is_not_empty(local_sentence['text']):
                for reference in self.ref_spans:
                    if self.sentence[reference["start"]:reference["end"]] != reference['text']:
                        print("The reference " + reference['text']
                              + " offsets are not matching in sentence '" + self.sentence + "'. The offsets correspond to "
                              + self.sentence[reference["start"]:reference["end"]])
                        print(local_sentence)

            self.sentence = None
            self.currentOffset = 0
            self.is_footnote = False
            self.ref_spans = None
            self.formula_spans = None
            self.list_spans = None
            self.current_sentence_id = None
            self.current_sentence_coordinates = None
            '''
            elif name == "p" or name == 'figDesc' or (name == 'note' and self.is_footnote):
                # end of paragraph
                if self.paragraph == None:
                    self.paragraph = ''
                self.paragraph += self.accumulated

                local_paragraph = OrderedDict()
                if self.section is not None:
                    local_paragraph['section'] = self.section
                local_paragraph['text'] = self.paragraph
                if self.ref_spans is not None and len(self.ref_spans) > 0:
                    local_paragraph['ref_spans'] = self.ref_spans
                if self.list_spans is not None and len(self.list_spans) > 0:
                    local_paragraph['list_spans'] = self.list_spans
                if self.formula_spans is not None and len(self.formula_spans) > 0:
                    local_paragraph['formula_spans'] = self.formula_spans

                if _is_not_empty(local_paragraph['text']):
                    if self.abstract:
                        self.document["abstract"].append(local_paragraph)
                    elif "body_text" in self.document:
                        self.document["body_text"].append(local_paragraph)

                # Validating the reference offsets
                if self.ref_spans is not None and _is_not_empty(local_paragraph['text']):
                    for reference in self.ref_spans:
                        if self.paragraph[reference["start"]:reference["end"]] != reference['text']:
                            print("The reference " + reference['text']
                                  + " offsets are not matching in paragraph '" + self.paragraph + "'. The offsets correspond to "
                                  + self.paragraph[reference["start"]:reference["end"]])
                            print(local_paragraph)

                self.paragraph = None
                self.currentOffset = 0
                self.is_footnote = False
                self.ref_spans = None
                self.formula_spans = None
                self.list_spans = None
            '''
        elif name == "abstract":
            self.abstract = False
        elif name == 'ref':
            if self.in_head_section:
                if self.section is None:
                    self.section = self.accumulated
                else:
                    self.section += self.accumulated
            else:
                '''
                if self.paragraph == None:
                    self.paragraph = ''
                self.paragraph += self.accumulated
                '''
                if self.sentence == None:
                    self.sentence = ''
                self.sentence += self.accumulated

            if self.current_reference is not None:
                self.current_reference["text"] = self.current_reference["text"] \
                                                 + self.accumulated if 'text' in self.current_reference else self.accumulated
                self.current_reference["end"] = self.currentOffset + len(self.accumulated)
                if self.ref_spans is None:
                    self.ref_spans = []
                self.ref_spans.append(self.current_reference)
            self.current_reference = None
        elif name == 'item' or name == 'label':
            '''
            if self.paragraph is None:
                self.paragraph = ''
            self.paragraph += self.accumulated
            '''

            if self.sentence is None:
                self.sentence = ''
            self.sentence += self.accumulated

            if self.current_item_list is not None:
                self.current_item_list["end"] = self.currentOffset + len(self.accumulated)
                if self.list_spans is not None:
                    self.list_spans.append(self.current_item_list)
            self.current_item_list = None
            if name == 'item':
                if self.sentence == None:
                    self.sentence = '\n'
                else:
                    self.sentence += '\n'
            elif name == 'label':
                if self.sentence == None:
                    self.sentence = ' '
                else:
                    self.sentence += ' '
        elif name == 'formula':
            if self.current_formula is not None:
                self.current_formula["end"] = self.currentOffset + len(self.accumulated)
                if self.formula_spans is None:
                    self.formula_spans = []
                self.formula_spans.append(self.current_formula)
            self.current_formula = None

            # at this point, if the formula appears outside a paragraph (GROBID TEI schema), we consider it as a 
            # paragraph in the JSON output
            if self.sentence == None:
                self.sentence = self.accumulated
                local_sentence = OrderedDict()
                if self.section is not None:
                    local_sentence['section'] = self.section
                local_sentence['text'] = self.sentence
                if self.formula_spans is not None and len(self.formula_spans) > 0:
                    local_sentence['formula_spans'] = self.formula_spans
                if _is_not_empty(local_sentence['text']):
                    if self.abstract:
                        self.document["abstract"].append(local_sentence)
                    elif "body_text" in self.document:
                        self.document["body_text"].append(local_sentence)
                self.currentOffset = 0
                self.sentence = None
            else:
                self.sentence += self.accumulated
        elif name == 'mi' or name == 'mo' or name == "mn" or name == '<mrow>':
            # these are the mathml only, chemical formulas are external files not considered here 
            if self.sentence == None:
                self.sentence = ''
            self.sentence += self.accumulated
        else:
            if self.skip:
                self.currentOffset -= len(self.accumulated)
                self.skip = False
        # print("endElement '" + name + "'")

        if name == 'item' or name == 'label':
            self.currentOffset += len(self.accumulated) + 1
        else:
            self.currentOffset += len(self.accumulated)

        self.accumulated = ''

    def characters(self, content):
        self.accumulated += content

    def getDocument(self):
        return self.document

    def clear(self):  # clear the accumulator for re-use
        self.accumulated = ""

def _is_not_empty(string):
    string = string.strip(' \n\r\t')
    return (len(string) != 0)

def convert_tei_string(stringXml):
    # as we have XML mixed content, we need a real XML parser...
    parser = make_parser()
    handler = TEIContentHandler()
    parser.setContentHandler(handler)
    parser.parseString(stringXml)
    document = handler.getDocument()
    return json.dumps(document, indent=4)


def convert_tei_file(tei_file, output_path=None):
    # as we have XML mixed content, we need a real XML parser...
    parser = make_parser()
    handler = TEIContentHandler()
    parser.setContentHandler(handler)
    print(tei_file)
    parser.parse(tei_file)
    document = handler.getDocument()

    #add_paragraph_ids(document)
    #add_sentence_ids(document)

    if output_path is None:
        output_file = tei_file.replace(".tei.xml", ".tei.json")
    else:
        output_file = os.path.join(output_path, ntpath.basename(tei_file).replace(".tei.xml", ".tei.json"))
    print(output_file)
    with open(output_file, 'w') as outfile:
        json.dump(document, outfile, indent=4)


def add_paragraph_ids(document):
    id = 0
    for para in document['abstract'] if 'abstract' in document else []:
        para['id'] = 'a' + str(id)
        id += 1

    id = 0
    for para in document['body_text'] if 'body_text' in document else []:
        para['id'] = 'b' + str(id)
        id += 1

    return document

def convert_batch_tei_files(path_to_tei_files, output_path=None):
    for file in os.listdir(path_to_tei_files):
        local_path = os.path.join(path_to_tei_files, file)
        if os.path.isfile(local_path) and local_path.endswith(".tei.xml"):
            if output_path is None:
                convert_tei_file(local_path, path_to_tei_files)
            else:
                convert_tei_file(local_path, output_path)
        elif os.path.isdir(local_path):
            convert_batch_tei_files(local_path, output_path)
        else:
            continue

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert a TEI XML file into CORD-19-style JSON format")
    parser.add_argument("--tei-file", type=str, help="path to a TEI XML file to convert")
    parser.add_argument("--tei-corpus", type=str, help="path to a directory of TEI XML files to convert")
    parser.add_argument("--output", type=str,
                        help="path to an output directory where to write the converted TEI XML file, "
                             "default is the same directory as the input file")

    args = parser.parse_args()
    tei_file = args.tei_file
    tei_corpus_path = args.tei_corpus
    output_path = args.output

    # check path and call methods
    if tei_file is not None:
        if not os.path.isfile(tei_file):
            print("the path to the TEI XML file is not valid: ", tei_file)
            exit(-1)
        else:
            convert_tei_file(tei_file, output_path)
            exit(1)
    elif tei_corpus_path is not None:
        if not os.path.isdir(tei_corpus_path):
            print("the path to the directory of TEI files is not valid: ", tei_corpus_path)
            exit(-1)
        else:
            convert_batch_tei_files(tei_corpus_path, output_path=output_path)
            exit(1)
    else:
        print("The supplied arguments were not sufficient. ")
        parser.print_help()
