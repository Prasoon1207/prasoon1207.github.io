---
title: llm2vec
layout: post
date: 2024-09-24 15:09:00
description: Can decoders produce rich representations?
tags: paper
categories: papers
---

<div style="text-align: center;">
    <img src="/assets/papers/parishad2024llm2vec/header.png" alt="paper_header">
</div>

<br><br>
	
**Idea**

Excellent ideas can come from the smallest of observations. We know that there is a widespread use of **bidirectional encoders** for producing rich text representations, both word-level and sentence-level. This ability is instilled in them by their pretraining recipe, which enables them to 1) predict the <MASK> token by looking at the left and right context around it and, 2) predict how likely two sentences could appear together, in a context. The pretraining recipe is designed in a way that it sort of _mask's_ a significant chunk of words (~15%). However training **unidirectional encoders** involves them having complete visibility over the pretraining data. It only makes sense to compare their performance as produces of contextual embeddings. We will now take a brief look at the framework called  <a href='https://github.com/McGill-NLP/llm2vec'>**llm2vec**</a>, which enables backwards-looking decoders to create even better text representations than their bidirectional counterparts.

<br>
<br>

**Making future visible** <br>

To create good word-level representations, it is imperative to look at both left-sided and right-sided contexts. The authors propose replacing the causal attention matrix with a matrix of only 1's. This ensures bidirectional interactions of token representations and leads to more _context-aware_ embeddings. A point that was impressively acknowledged in the paper, was that since these decoders are trained in one direction, it is not obvious whether the embeddings produced by imposing bidirectionality, have any rich meaning. This is also observed by them experimentally. It is commendable that the authors push through this, what could have been a sad evening at the research lab and introduce two more crucial steps in the llm2vec framework.

**What is the next _masked_ word?** <br>
Given a sequence of tokens, $(w_{1}, w_{2}, [MASK], w_{3}, w_{4}, ...)$, bidirectional encoders create a representation of $[MASK]$ from the lateral context. To instil creating rich representations using decoder-based LLMs, the authors propose **MNTP** (**M**asked **N**ext **T**oken **P**rediction). The model now uses the representation of $w_{2}$ (in the bidirectional sense) to check for similarity against the golden representation of the true $[MASK]$ token.

**Are these two sentences related?** <br>
Given a collection of sentences **S**, for any two sentences, say $s_{i}$ and $s_{j}$ (in **S**), we know if these sentences could appear **meaningfully** in a context. The authors use this technique, called as **unsupervised contrastive learning**, to make better sentence representations. The representations are created by pooling the constituent word representations.
The paper proposes passing a sentence, say $s$, twice into the model with random dropout weights. Then, these two representations are trained to appear closer in the embedding space and their representation with an unrelated set of sentences is made to appear far from each other. 
