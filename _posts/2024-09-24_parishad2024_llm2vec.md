---
title: llm2vec
layout: post
date: 2024-09-24 15:09:00
description: Can decoders produce rich representations?
tags: paper embeddings
categories: papers
featured: true
---

<div style="text-align: center;">
    <img src="/assets/papers/zhao2024multilingualism/header.png" alt="paper_header">
</div>

<br><br>
	
**Idea**

Excellent ideas can come from the smallest of observations. We know that there is a widespread use of **bidirectional encoders** for producing rich text representations, both word-level and sentence-level. This ability is instilled in them by their pretraining recipe, which enables them to 1) predict the <MASK> token by looking at the left and right context around it and, 2) predict how likely two sentences could appear together, in a context. The pretraining recipe is designed in a way that it sort of _mask's_ a significant chunk of words (~15%). However training **unidirectional encoders** involves them having complete visibility over the pretraining data. It only makes sense to compare their performance as produces of contextual embeddings. We will now take a brief look at the framework called  <a href='https://github.com/McGill-NLP/llm2vec'>**llm2vec**</a>, which enables backwards-looking decoders to create even better text representations than their bidirectional counterparts.
<br>
**Making future visible**
**What is the next _masked_ word?**
**Are these two sentences related?**
