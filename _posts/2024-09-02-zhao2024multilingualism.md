---
title: mwork
layout: post
date: 2024-08-31 15:09:00
description: How do Large Language Models Handle Multilingualism?
tags: paper multilingualism
categories: papers
featured: true
---

<div style="text-align: center;">
    <img src="/assets/papers/zhao2024multilingualism/header.png" alt="paper_header">
</div>

<br><br>
	
In this work, the authors introduce a new framework for explaining the property of multilingualism in Multilingual Large Language Models (MLLMs). How do we define this property of 'Multilingualism'? The property of multilingualism enables MLLMs to text in multiple languages. In this paper, the authors have introduced a framework they call **MWork** which states that MLLMs first convert queries to a unified representation. They reason on this unified representation with multilingual knowledge extraction and finally, they translate queries to the target language.

1. Conversion to a _unified representation_ - <br>
   The authors state that the first step in handling non-English queries is to convert them to English in the initial layers of MLLMs.  According to Hou et al., 2023, attention mechanisms are utilized in reasoning over a text corpus. The authors observe a decrease in the number of _non-English_ neurons (?) of the attention matrices in the middle layers of the MLLMs.  _Can reasoning be performed over text in a language other than English?_ It is unlikely owing to the decline in the number of non-English neurons in the reasoning (attention structures) regions of MLLMs.

2. Task-Solving - <br>
  _What about the neurons in the FFN layers?_ - The authors observe NO decrease in the number of language-specific neurons in FFN structures across all layers of MLLMs. Hence, the authors decompose the task-solving into two steps: _thinking_ in English and _extracting knowledge_ multilingually from language-specific neurons in the middle layers of MLLMs.

3. Generation of output - <br>-
	**MWork** proposes that models _generate_ responses by translating back to the query's original language. _At this stage, one can think of a simple verifying experiment for this step_. Suppose we have a query in two non-English languages say, French and Urdu. Consider a query requiring extraction of a knowledge point prevalently common in both French and Urdu literature. _Will there be an inconsistency in MLLM performance?_ (Maybe we can intercept the residual embeddings to see the checkpoint of back-translation initiation for languages structurally dissimilar to English.)


**How will I verify it?**

 I will look at each of the three steps separately: _conversion_ to unified English representation, _task-solving_ and _translation_. **_Conversion_** -> Relative amount of English / non-English tokens; _Does the converted representation still relate to the original query? (Can we quantify it?) <- Credits to Eshaan Tanwar from LCS2 for suggesting this._ 2.  **_Task-Solving_ MLWork** claims that knowledge is extracted from language-specific neurons in the FFN structures. _Does deactivating these neurons affect the performance?_ ALSO, is the knowledge diffused into different languages or localized to the language of the pretraining text? _Consider a setup when some knowledge is only limited to Vietnamese literature. Does deactivating neurons of FFN of Vietnamese completely downgrade MLLM performance?_<br><br><br>
		Is there a way to identify neurons relating to some knowledge?<br>
        How much overlap do they have with language-specific neurons?<br><br><br>
_**Translation**_ -> I will certainly want to look at works trying to mechanistically interpret translation in MLLMs. (Is there a gap here?). Using those, one can design experiments to test this.
<br>
The authors found that "_deactivating randomly sampled neurons in the task-solving layers disables the capabilities of LLMs in reasoning to a greater extent than deactivating randomly sampled neurons in all layers_". This proves that the middle layers are associated with _thinking_ + _extracting knowledge_ (basically _task-solving_). (Note the authors refer to these _middle_ layers of MLLMs as the _task-solving_ layer.) <br><br>
**How to verify separation of _thinking in English_ and _extracting knowledge multilingually?_** <br><br>
- I would have created a synthetic task that does not involve any nuanced knowledge extraction (_Commonsense reasoning_ over multiple languages). Taking some non-English languages under study :  **(1)** Deactivate these language-specific neurons in the FFN structures of the _task-solving_ layer. (Since I am not sure if knowledge from one language gets leaked into other language-specific neurons of FFN, let me propose all of these language-specific neurons of FFN) **(2)** Compare the performance of MLLMs with and without deactivation.
  Moreover, deactivating language-specific neurons of the attention structures in the _task-solving_ layer should not have much effect on non-English queries as compared to English queries.
- The authors also claim that _deactivating language-specific neurons within the feed-forward structure of the task-solving layer predominantly affects non-English languages_. This implies that processing multilingual queries necessitates accessing the multilingual information embedded within the relevant structures.<br><br>

**How to verify the translation/generation structure of MWork**-
The authors have deactivated language-specific neurons in the final layers of the MLLMs and commented on a decline in performance. As I mentioned earlier, there can be ways to selectively comment on the nature of translation happening at this stage. The authors have further shown that selectively fine-tuning the parameters in the language-specific neurons enhances the performance of MLLMs for queries in that language.
<br>
**Questions for further research -**
- Polyglots are shown to process native languages at much greater ease as compared to other languages, even at the same level of proficiency. Given we declare it as the native language for the LLMs, can we quantify if being subjective to pre-training in multilingual corpora, affects the _ease_ of handling English queries? (Let the setting be purely reasoning-based and let _ease_ be quantified as the number of neurons activated in the task-solving layer.
