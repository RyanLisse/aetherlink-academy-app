# Weather decision skill

When the learner asks about umbrellas or outdoor plans for a city+date:

1. Call **Get Weather** with the training-lab mock base URL.
2. Keep the returned fixture fields in the answer.
3. Decide `bring umbrella` when `precipitationProbability >= 60`, else `leave umbrella`.
4. Phrase the answer as a **draft** for human review — never auto-send.
