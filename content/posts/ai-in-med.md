---
title: "AI in Medical Diagnosis"
date: 2026-05-23
excerpt: "AI can already match doctors on narrow imaging tasks — but bias, brittleness, and opaque reasoning are why the clinician still has to stay in the room."
---

For a recent university paper I dug into one of the most hyped frontiers in medicine: using artificial intelligence to make diagnoses. The promise is easy to state — faster, more consistent reads of scans, lab values, and patient data, with scarce expertise spread further. The reality, it turns out, is more interesting than the headlines.

## Where AI already shines

The strongest results come from narrow, well-defined imaging tasks. As far back as 2017, a neural network trained on roughly 130,000 clinical images classified skin lesions at a level comparable to board-certified dermatologists. Today you find similar systems across radiology (spotting lung nodules, measuring volumes), pathology (sorting tissue samples), and dermatology. Where there's a mountain of labelled images and a clear question, the models do well.

There's also a quieter benefit that gets less attention than raw accuracy: efficiency. A lot of the real value isn't replacing the doctor — it's automating the repetitive scaffolding around the diagnosis, like pre-sorting, prioritising, and measuring, so clinicians have more time for the hard cases.

## Why it's not that simple

The hype tends to skip the asterisks, and there are a few big ones:

- **The headline numbers don't generalise.** A 2025 meta-analysis of 80-plus studies found that generative AI models, on average, weren't clearly distinguishable from physicians — but they performed *worse* than genuine specialists. Peak scores from ideal conditions rarely survive contact with the messy clinical everyday.
- **Bias is baked in.** A model mirrors its training data. Skin-cancer models trained mostly on lighter skin perform worse on darker skin tones — and the failure often goes unnoticed when the test set isn't diverse enough to reveal it.
- **The reasoning is opaque.** Many high-performing models can't really explain *why* they reached a recommendation. That's a problem when a patient has a legitimate interest in understanding a decision that affects them — and when someone has to be accountable if it's wrong.

## The takeaway

The evidence points toward a complementary role rather than a replacement one. AI is most valuable where expertise is scarce, but it still trails experienced specialists. That argues for a hybrid setup: AI as a second reader or triage tool that backs up the clinical decision instead of taking it over — deployed under human oversight, inside transparent processes, and continuously validated.

Less "the algorithm will see you now," more "the algorithm flagged this, and your doctor took a closer look." That's the version worth building toward.