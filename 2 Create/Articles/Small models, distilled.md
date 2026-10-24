---
date: 2026-10-24
summary: How a small language model is made from a large one, and what you give up: distillation, quantisation, and the quiet third ingredient, data.
tags: [article, ml, llm, slm, draft]
---
# Small models, distilled

> Draft. Structure and arguments are done; numbers in the "what you give up" section should be checked against the papers before this is final.

## Introduction

For a few years the story of language models was a single word: bigger. Then phones, laptops and single GPUs started running models that write, summarise and call tools well enough to be useful, at a few billion parameters instead of a few hundred billion. These are small language models, SLMs, and they are not simply large models trained with less money. They are made, deliberately, out of large ones.

This article explains the two techniques that do most of the work, knowledge distillation and quantisation, and the one that quietly matters as much as either: what the small model is trained on.

## Main part

### Distillation: learning from the answer sheet

A model trained from scratch learns from hard labels: the next token was "cat", full stop. A model trained by distillation learns from a teacher's full probability distribution over the next token: "cat" 0.6, "kitten" 0.25, "dog" 0.05, and so on. That distribution carries far more information per example. It tells the student not only what was right but what was *nearly* right, and which wrong answers are absurd.

Formally the student minimises a mix of two losses: the usual cross-entropy against the real token, and the KL divergence between its distribution and the teacher's, usually with a temperature that softens both so the small probabilities are visible. In practice the teacher's "dark knowledge", the shape of its uncertainty, is what lets a model a tenth of the size land surprisingly close to it on benchmarks.

There is a second flavour that has become more common: instead of matching distributions token by token, you let the teacher *write the training data*. Generate questions, generate careful answers, filter the bad ones, and fine-tune the student on the result. This is sequence-level distillation, and it is how most of the recent small instruction-following models were built.

### Quantisation: fewer bits per number

Distillation shrinks the number of parameters. Quantisation shrinks each one.

Weights are trained in 16-bit floating point. Most of that precision is wasted at inference time, so you store each weight in 8 bits, 4 bits, sometimes fewer, with a scale factor per block of weights that maps the small integers back to roughly the right real values. A 7-billion-parameter model is about 14 GB in 16-bit and about 4 GB at 4-bit, which is the difference between "needs a server" and "runs on a laptop".

The subtlety is *which* weights can take the hit. A handful of channels in every transformer have outlier activations far larger than the rest, and quantising them naively destroys the model. The good methods, GPTQ, AWQ and their relatives, either keep those channels in higher precision or rescale them before rounding, and they choose rounding errors that cancel rather than accumulate. The result is that 4-bit models lose a point or two on most tasks instead of falling apart.

### The third ingredient: data that teaches

Here is the part the headlines skip. The small models that punch above their weight were trained on *less* data than you would expect, chosen more carefully: textbook-style explanations, worked code with comments, synthetic exercises with solutions. The argument is simple once said. A small model has a limited budget of parameters; spending them on memorising web noise is a waste, and a curriculum of clean, dense, explanatory text teaches the patterns that transfer.

So the recipe for a modern SLM is: a large teacher that writes or grades the data, a curated corpus small enough to be reasoned about, distillation to borrow the teacher's judgment, and quantisation so the result fits where it is needed.

### What you give up

Honesty about the trade:

- **Breadth of knowledge.** A small model knows fewer facts, full stop. It is a reasoner with a thin encyclopaedia, which is why retrieval (handing it the documents) matters more for small models than for large ones.
- **Long-tail robustness.** Prompts far from the training distribution degrade faster.
- **Quantisation noise** shows up first in arithmetic and in long chains of reasoning, where small errors compound.

What you get is latency, privacy, cost, and the ability to fine-tune on one GPU. For most products that run many simple requests, that is the right side of the trade.

### What I want to try

- Distil a tiny model on one narrow task (say, classifying maths problems by topic) from a larger open model, and measure how much of the teacher's accuracy survives at each student size.
- Quantise the same student to 8-bit and 4-bit and watch where it breaks first.

## Conclusion

A small language model is not a lesser large one. It is a large one's judgment, compressed twice: once by learning from the teacher's distribution instead of from bare labels, and once by storing each weight in a few bits. The quiet third step, training on text that explains rather than text that merely exists, is what makes the first two work.

## References
1. Hinton, Vinyals and Dean. *Distilling the Knowledge in a Neural Network* (2015).
2. Frantar et al. *GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers* (2022).
3. Lin et al. *AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration* (2023).
4. Gunasekar et al. *Textbooks Are All You Need* (2023).
