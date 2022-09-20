# Softcite Context Classification

The goal of the classification task is to characterize a software or dataset mention context from a scholar article. 

## Labels

### General principle

Setting the value of a label for an highlighted software/dataset mention context must be done **considering the displayed context, not the full article**. You should therefore analyze only the provided context to see if there are enough evidence or not to set a label.  

### Used

`used`: boolean value

Set this label to true when the mentioned software or dataset is used in the describe research work, from the evidence displayed in the text context. 

### Created

`created`: boolean value

Set this label to true when the mentioned software/dataset has been created in the describe research work, from the evidence displayed in the text context. 

### Shared

`shared`: boolean value

Set this label to true when the mentioned data or software has been shared in the described research work, from the evidence displayed in the text context. We expect here a sharing statement, not just reusing some existing data already public/shared.

To assess that some data or some software are shared, we need to identify evidence of actual public sharing e.g. url, data repository, permanent identifier ("data available on reasonable demand" is not an acceptable sharing statement). 

Public sharing means making available to the public, possibly under some access conditions and authentication (e.g. account registration, Security Awareness Certification, etc.).

The usage of shared data (e.g. "we used existing samples from GenBank") is not sharing data, as the data is already shared by a third party.

### Case with no positive label

A software can be mentioned in a scholar paper in the context of a discussion, background or existing work, for comparison, etc. It is thus relatively frequent that none of the labels are set to true. 

## When to ignore a case

A case should be marked as ignored when it is not possible to decide about the context, in particular:

1. when the highlighted context does not include a mentioned software or dataset

2. the context is too ambiguous to make a decision, and would require a more extensive reading of the article

3. the text is not readable or too short

## Preclassification

To facilitate the annotation, a preclassification took place and the different cases are pre-annotated. The confidence score of the preclassification are indicated for each label (next to the checkbox, in grey and in parenthesis). 

