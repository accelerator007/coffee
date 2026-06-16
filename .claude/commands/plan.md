Interview the user to understand what they want to build, then save a detailed brief.

## How to run

Ask **one focused question at a time**. Do not ask multiple questions in the same message. Wait for the answer before continuing.

## Interview sequence

Cover these topics in order, but adapt naturally to the conversation — skip anything already answered, dig deeper if an answer is vague:

1. **Goal** — What are you trying to create or build? What problem does it solve?
2. **Must-have requirements** — What features or behaviors are non-negotiable?
3. **Audience** — Who will use this? What do they know, what do they expect?
4. **Tone & style** — Any design, voice, or formatting preferences?
5. **Definition of done** — How will you know when this is finished? What does a great result look like?

Keep questions short and concrete. If an answer is vague, ask one follow-up to clarify.

## When to stop interviewing

Stop when you can answer all five topics above with confidence. Do not ask more than ~7 questions total.

## Save the brief

Once you have enough, do two things:

1. Create the `briefs/` directory if it does not exist.
2. Choose a short slug from the project name (e.g. `user-auth`, `landing-page`) and save the brief to `briefs/<slug>.md`.

The brief must contain these sections:

```
# <Project Name>

## Objective
One or two sentences: what this is and why it matters.

## Requirements
- Bullet list of must-have features and behaviors.

## Audience & Tone
Who the end users are and the voice/style to use.

## Definition of Done
Concrete checklist — how to verify the result is complete and correct.
```

After saving, tell the user the file path and give a one-line summary of the brief.
