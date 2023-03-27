# Softcite Software Mention Labeling

The goal of the labeling task is to identify a mentioned software with its main attributes in a scholar article. 

Labeling is currently applied at sentence level. If an attribute of a software (e.g. the publisher) is located outside the sentence where the software name appears, it is ignored. 

In case several software names occur in the same sentence, the correct attachment of attributes can be specified via relations (relation of type `attribute`) to solve possible attachment ambiguities.

## Labels

### Summary of labels

Ten labels are used in the software mention labeling tasks: 

* `software`

    * `software/environment`

    * `software/component`

    * `software/implicit`

* `version`

* `publisher`
    
    * `publisher/person`

* `url`

* `language`

* `reference`

### Software name

The main label of a software mention is its software name. A software mention must have one and only one software name. A software name can have one of the four following labels: 

* `software`

    * `software/environment`

    * `software/component`

    * `software/implicit`

These four labels are the "head" of a software mention, all the other labels are attributes of a software mention (they further introduce attributes of a software). 

The four labels are described in the next sections. Note that for determining the type of a software, some search about the software on the internet is often necessary. 

#### Default software name: `software`

The label `software` is used for named software expressed _in the mention context_ without dependency to another software. This software does not require additional code/script if used in the research work and is named. 

1.
```
    " the data were analyzed using **Multi Gauge** Version 3.0 software (FUJIFILM). "
```

-> _Multi Gauge_ should be labeled `software`

2.
```
    " The open-source software **ITK- Snap** 2.0.0 35  is used to manually delineate 
      the tumour on each MRI slice where it is visible. "
```

-> _ITK- Snap_ should be labeled `software`

3.
```
    " Post-acquisition image processing was carried out using **CorelDraw** 12 
      software. "
```

-> _CorelDraw_ should be labeled `software`

#### Software environment: `software/environment`

The label `software/environment` is used for a mentioned software requiring some code/scripts to realize the research task, expressed with or without dependency to another software _in the mention context_. Typical examples are MATLAB or STATA. Many statistical analysis tools are environments where analysis are programmed as scripts. 

1.
```
    " The maximum likelihood outcrossing rates were estimated in **Mathematica** 7 following 
      the method used by Johnson et al. (2004) "
```

-> _Mathematica_ should be labeled `software/environment` 

2.
```
    " All image processes and statistical analyses were done using **Matlab** (Mathworks, 
      Natick, MA, USA). ""
```

-> _Matlab_ should be labeled `software/environment` 

#### Software component: `software/component`

The label `software/component` is used for a named software depending on another software environment mentioned in the mention context to run. We always have a software environment expressed in the same mention context, and the dependency of the software component to the software environment is encoded with a relation to the chunk of the software environment. 

1.
```
    " Area under the curve (AUC) was estimated by **R** package **pROC** to determine 
      the 95% confidence intervals (95%CI). "
```

-> _R_ should be labeled `software/environment` and _pROC_ as `software/component`

2
```
    " For the variance ratio test, I used the **Stata** command **sdtest**. "
```

-> _Stata_ should be labeled `software/environment` and _sdtest_ as `software/component`

3.
```
    " This library is based on the **Python** package **NetworkX** (Hagberg et al., 2008). "
```

-> _Python_ should be labeled `software/environment` (it refers to Python as the imlemented programing environment, not just the language) and _NetworkX_ as `software/component`

4.
```
    " D-prime, which measures the distance between the signal and the noise means in standard deviation units 
      (40), was calculated using **matlab** function **dprime_simple** 
      (https://it.mathworks.com/matlabcentral/fileex change/47711-dprime-simple-m) "
```

-> _matlab_ should be labeled `software/environment` and _dprime_simple_ as `software/component`


#### Software implicit: `software/implicit`

The label `software/implicit` is used for an unnamed software. The software refering expression is a generic term for program, such as program, code, script, macro, package, library, etc. Optionally, if the unnamed software is depending on another software environment to run, the software environment being expressed in the mention context, then the the dependency of the unamed software to the software environment is encoded with a relation the software environment chunk (similarly as for a software component). 

1.
```
    " We developed a Perl **program** to store all the graph paths for a given protein. "
```

-> _program_ should be labeled `software/implicit` 

2.
```
    " In this paper, we aimed to evaluate the heterogeneity of liver parenchyma on Gd-EOB-DTPA-enhanced MR images, using CV 
      value processed by our MATLAB-based **software**. "
```

-> _software_ should be labeled `software/implicit` 

3.
```
    " The Matlab **code** is downloadable in mwkang.site11.com/code/rie2016. "
```

-> _code_ should be labeled `software/implicit`  

### Version: `version`

The `version` label identifies the version of the mentioned software. It can be a number, an identifier or a date. It is expected that a mentioned software has **only one** version. 

Version annotation should cover only the specific number or date string, without any other token like "version", "v.", etc. or extra punctuations:

1.
```
    " We performed meta-analysis using Review Manager Software (version **5**). "
```

-> chunk to be labeled `version` is `5` 


2.
```
    " All statistical analyses were conducted with IBM SPSS Statistics ver. **20.0** 
      (IBM Co., Armonk, NY, USA). "
```

-> chunk to be labeled `version` is `20.0` 


3.
```
    " SPSS V.**15.0** for Windows was used for all the statistical analyses. "
```

-> chunk to be labeled `version` is `15.0` 


### Publisher or Creator: `publisher`

The label `publisher` identifies the entity distributing the software to the public. It is usually the organization or the company owning the software or having developed the software. In case the creator/developer persons are directly mentioned, they are also labeled as `publisher`. It is expected that a mentioned software has only one publisher. 

A publisher annotation should only contain the name of the publisher, including the possible legal form (Inc., LLC, GmbH, etc.) of the business entity when present, but not its address:

1.
```
    " SPSS ver. 11.0 (**SPSS Inc.**, Chicago, IL, USA) was used to evaluate the data. "
```

-> _SPSS Inc._ should be labeled `publisher`

2.
```
    " ... followed by the Tukey-Kramer post hoc test performed with GraphPad prism software 
      (version 4.0, **GraphPad Software**, San Diego, CA, USA). "
```

-> _GraphPad Software_ should be labeled `publisher`

3.
```
    " All the analysis was performed in the MATLAB environment (**The MathWorks**, Natick, MA) "
```

-> _The MathWorks_ should be labeled `publisher`

#### Publisher or creator as a mentioned person: `publisher/person`

In case the creator/developer persons are directly mentioned, the label `publisher/person` must be used:

1.
```
    " Sequences obtained were analyzed and edited using BioEdit 7.2.5.&#169;1999-2013 software (**Tom Hall**, 
      Ibis Biosciences, Carlsbad, CA). "
```

-> _Tom Hall_ should be labeled `publisher/person`

2.
```
    " We have found a way to double the accuracy of Matlab's **Ricatti** equation solver lyap.m by 
      essentially applying it twice. "
```

-> _Ricatti_ should be labeled `publisher/person`


### URL: `url`

The label `url` identifies an hyperlink associated to the software. The URL can link to the code repository, to the software project page, to its documentation, etc. Although very rare, it is possible to have several `url` labels for a software. 

If the URL is found in a footnote outside the rest of the mention context, typically without any other text, it is not annotated. 

If the URL appears as clickable PDF annotation only - for example the name of the software is clickable in the PDF and trigger a GOTO action to call the web browser to this URL, but the URL string is not visible in the text, it is not annotated. If the URL appears in the text and is clickable, it is annotated similarly as the non-clickable URL.

### Programming language: `language`

The label `language` identifies the programming language of the mentioned software if present in the mention context. We only consider here the language when used to indicate how the source code is written, not the language as a broader reference to the programming environment used to develop the mentioned software, see in the interpretation section for more explanation. 

1.
```
    " Sequences were further annotated with **PERL** scripts. "
```

-> _PERL_ should be labeled `language`

### Bibliographical reference callout: `reference`

Biblographical reference callouts (also called reference markers) are identified with the label `reference`. It is expected that the these markers are identified in the software mention context when referring to the mentioned software. They can be optionally link to the software mention via a relation. However, this linkage is currently not required. 

## Definition/scope for software annotation

### 1) We annotate all software, not just "research software"

We consider mentions of software in scientific literature without limitation to "research software". We found the notion of "research software" unclear. 

From the point of view of software sharing, "research software" is usually understood as software produced by researchers or by research software engineers. However, mainstream commercial software are very broadly used in science and mentioned in scholar papers when describing research activities. Examples of very commonly mentioned general purposes and mainstream software are Excel, Photoshop or PostgresQL. Such general software can also be the object of a research study. So, from the point of view of software citation, any software mentioned in scholar literature is relevant - they are "software of interest" for research and should be annotated.  

### 2) What should be considered as a "software" entity?

Software products correspond in practice to various artefacts, which are not always clear to consider as "software". This is particularly challenging from the point of view of software citation, but this remains an issue even when identifying software sharing. 

A standard definition of software is "a collection of computer programs that provides the instructions for telling a computer what to do and how to do it" (Wikipedia). Everything that can provide processing instructions to a computer, whatever its form, can therefore be seen as software. This relatively broad definition of software covers a large variety of software products, for instance from macro and formula part of an Excel sheet to large software project with multiple components, hundred thousand lines of source code and binary packages for a variety of computing environments. 

Any of these software products have a potential research interest, for reuse or reproducibility purposes, and could be therefore valuable to share. Monitoring software in research supposes to be able to identify any mentions of a software product independently from the scale of the software production and independently from its form. 

The types/formats of software depend a lot on the technical domain and the used programing framework. 

**We propose to cover the notion of software in general independently from any particular distribution forms.** 

- **Software** products typically can be published as standalone applications or libraries/plugins, either as executable code (binaries), package (e.g. R package, combining script and binaries), as a more comprehensive open source project (program, script, data resources, documentation, build scripts, etc.), script program or macro to be interpreted and exectuted within a particular software environment, source code that require manual building, small standalone script (e.g. "gist"), plaform (including data, data management software and service software), web services, images to be executed as containers, or software embedded in an hardware device.

All these software distribution formats are considered as software to be annotated for the present annotations guidelines. 

- **Algorithm** versus software: as a general guideline, algorithm mention are not considered as software mention and are not be annotated. However, it is quite frequent that the name of an algorithm and its implementation (so as software) are used in papers in an interchangeable manner. While it is clear that we want to exclude "algorithm names" from software entities, they can be used to refer to the implementation. This is one of the most frequent ambiguity we have identified in the Softcite dataset and this was similarly reported for the [SoMeSci dataset](https://doi.org/10.1145/3459637.3482017). The distinction could sometime be done in context, but a guideline is necessary when the usage of the name is general and ambiguous on purpose. 

Examples: [10.1038/ng.2007.13](https://pubmed.ncbi.nlm.nih.gov/17952075/)

```
    " Finally, we applied the EIGENSTRAT method [46], which relies on patterns of correlation 
      between individuals to detect stratification, to our Icelandic discovery sample. "
```

*EIGENSTRAT* here is the name of the method and of the software implementing the method. As the context describes the application of the method of the algorithm on actual data, it refers to the use of the software implementation and it should therefore be annotated as a software mention.

[10.1038/bjc.2016.25](https://www.nature.com/articles/bjc201625)

```
    " Messenger RNA expression was normalised to household gene expression (GAPDH and RPL13A 
      for BON-1; HPRT and YWAZ for QGP-1) according to the geNorm algorithm (Mestdagh et 
      al, 2009). "
```

*geNorm* is an algorithm and referenced as such above, but it is software too - and the software is actually used for the normalization in the described research. It should therefore be annotated as a software mention.

As a general guidelines regarding an algorithm name and its implementation used in an interchangeable manner in a scholar publication: in case the reference is made to an implemented algorithm with the algorithm name, we consider it as software mention if the context indicates that the implemented software aspect is involved in the statement. 

- The notion of **models** (machine learning models, simulation models) versus software is often unclear. Models encode data processing and executable action/prediction process. They are however in a format closer to data, because the "instructions" are only digital transformations. Models themselves should be run in a software environment. Despite their "executable" nature, models are usually not considered as software and have dedicated distinct sharing infrastructure (e.g. the [CoMSES Net](https://www.comses.net)). 

So as a general guideline, standalone models are **not** to consider as software product. 

However, like algorithms, we observe that it can be relatively frequent (in the machine learning area for example) to use the same name to refer both for a model and a software product for implementing/running a model. For example, `BERT` is a python software project (https://github.com/google-research/bert), a model, a family of models (retrained on different domains), or a ML approach (a Deep Learning architecture and methodology for training it):

[10.48550/arXiv.2103.11943](https://arxiv.org/pdf/2103.11943.pdf)

```
    " The representation of the BERT system allows it to be used as a basis for measuring the 
      similarity of sentences in natural languages "
```

Similarly as for algorithm, we need to identify whether the mention refers to the model product, the approach/method or the software to decide if the mention shall be considered as software mention or not. In case the reference is made in general to the whole framework, including the software, we would consider it as software mention. 

- **Database** versus software: in scientific publications, it is quite frequent to mention a database name as a general service covering the data and  software to access/search the data (including web services and database management software, e.g. PostgresQL). 

Example from PMC4863732

```
    " Scientific articles were obtained through PubMed MEDLINE "
```

MEDLINE is at the same time a large metadata collection and a database service to query this catalogue. 

Example from 10.1002/pam.22030

```
    " Data come from the Integrated Public Use Microdata Series (IPUMS) database "
```

Integrated Public Use Microdata Series (IPUMS) is a database and an online platform.

The related guideline for the Softcite corpus is as follow: 

```
    " The relevant distinction should be whether the text is referring to a data collection/dataset 
      (ie the data in the database) or to the software that provides access to a dataset. If it is 
      clear that they are referring to the data inside, it is not a reference to a software. " 
```

The guideline thus also means that when it is not clear that we refer to the data inside the database, it should be considered as software too. 

- Very common is life science, **scientific devices** are used in most of the experiments. They usually includes software, embedded or to be install on a PC to control the device, process the aquired data, export the data, etc.. 

Example: [PMC4644012](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4644012/)

```
    " The Gram-negative coccobacilli were initially identified as Pasturella pneumotropica by the 
      VITEK 2 system, software version 06.01 (BioMerieux, France) using the GN card, with bionumber 
      0001010210040001 and an excellent identification (probability 99%). "
```

The [VITEK 2 system](https://www.biomerieux-usa.com/clinical/vitek-2-healthcare) embeds software performing predictions. 

Given the variety of software embodiments, what is mentioned is often larger system or devices including software. It is thus important to decide in context to which part the authors are referring to. If the statement refers to the software part of the device then it should be annotated as software, otherwise it is left not annotated. 

- **Software components** of a more complete infrastructure: A reference is made to a general infrastructure, including some software components. For example in [10.20955/r.2018.1-16](http://herosolutions.com.pk/breera/foundation/images/whitepaper.pdf) "Bitcoin wallet". We consider that we are refering to a software environment, and thus annotate this as a software mention. 

- Reference to a **programming languages**. For example: [10.1257/jep.4.1.99](https://www.aeaweb.org/articles?id=10.1257/jep.4.1.99)

```
    " It is written in BASIC, a close analogue to FORTRAN. "
```

We consider that software languages (written in BASIC, in FORTRAN, ...) are not software per se, because they are specifications (a grammar), similar to a protocol specification. When used together with a specific software mention, programing language are considered as "attributes" of this software (e.g. written in R). They are not annotated as software but with the label `language`, which identifies in context the programming language of the mentioned software. 

Software tools for implementing a software language (like a C compiler, a Java virtual machine, an Integrated Development Environment like R-Studio, etc.) are software, they are annotated as a software mention. 

- **Operating system** (OS): when used together with a specific software mention, they are considered as "attributes" of this software (e.g. "running on Windows"). The reference to the OS here is just a further specification about the main software that is discussed. In this case, OS are not annotated as additional software mention. 

However, OS can also be referenced as such when the mention refers specifically to the OS implementation and not to some software using them. In this case, the OS is annotated as software. 

- Non-named usage of a programming environment. Software was produced on the environment (some code was written), but it is implicit, not shared, nor reusable. 

Example: [10.1136/gut.2011.238386](https://gut.bmj.com/content/gutjnl/61/1/69.full.pdf)

```
    " Multiple imputation was conducted in R 2.11. " 
```

The programming environment here is clearly a software and should be annotated as such. In addition, the non-named usage corresponding to the written code is also a software, implicit, running in the R environment, and should be annotated as a software mention. 

- **Workflow** as high-level specifications: in data-intensive scientific domains, the complexity of data processing has led to the common definiton and usage of workflows associated to a scientific experiments. Examples of such workflow systems are [Galaxy](https://galaxyproject.org) (life science), [Kepler](https://kepler-project.org) (physics and environment sciences), [Apache Taverna](https://incubator.apache.org/projects/taverna.html) (bioinformatics, astronomy, biodiversity - now retired), or [KNIME](https://www.knime.com). As workflows are formal instructions similar to high level scripting language, interpreted in a computer environment, and actually shared for reproducibility and reuse purposes. Therefore, we consider such executable workflows as software products. 

- **API**: An API is an intermediary product between documentation and executable software. It is challenging to decide if an API should be considered as software, because it requires an implementation to be executable. On the other hand, an API corresponds to instructions that can be executed when used on an environment or with other software components implementing the API, like other software depending on other software components. Given that it is the nature of an API to be shared and used for collaborative work in software, we consider API product as software too. 


## Additional annotation rules

* **Software name and acronym**: When present, we always keep an acronym in the same mark-up span as the software name:

1.
```
    " ... using the **Ingenuity Pathways Analysis (IPA)** tool... "

    " The user interface was linked to a **My Structured Query Language (MySQL)** database "
```

* **Combined publisher/software name:** We distinguish software publisher and software name when used in combination. For instance:

1.
```
    " For statistical analysis, we used **Microsoft** **Excel** "
```

-> _Microsoft_ should be labeled `publisher` and _Excel_ should be labeled `software`.

Exceptions are for software names always including the publisher by usage, the main cases being "Lotus Notes" (we never see "Notes" alone for this software) and "GraphPad Prism" ("Prism" only is not observed). 

When the software publisher is repeated with the software name in combination in the same mention, we annotated only the more comprehensive publisher form. For instance:

```
    " Observed heterozygosity was estimated in Microsoft Excel (**Microsoft Corporation**, Redmond, Washington, USA). "
```

-> In this sentence the highlighted _Microsoft Corporation_ should be labeled `publisher`, but not the first occurrence of "Microsoft".

The publisher appears two times, first as one word (`Microsoft`), followed by a more comprehensive form (`Microsoft Corporation`) after the software name. To simplify the mark-up, we only annotate in the mention the second form, following the above rule.  

* **Publisher in bibliographical marker**: If the publisher appears whithin a bibliographical reference marker (e.g. `(Schwab and al., 2011)` or `(R Development Core Team, 2020)`), it is not annotated. 

