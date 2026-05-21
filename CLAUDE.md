# What's Cookin' — Project Notes

## Auth & Meal Plan Behavior

- Signed-out users see a sample plan only.
- Personalized generation requires sign-in.
- Gemini failure must show retry/sample options — do not silently fall back to locally generated recipes.
- The local generator is a dev/test fallback only, not a production code path.
