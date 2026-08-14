<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Auto-Skill Activation & Engineering Standards (MANDATORY)

You must ALWAYS automatically apply the relevant installed skills from `.agents/skills/` on EVERY user prompt without waiting for the user to type slash commands (`/`):

1. **Frontend, UI/UX & Design Tasks (`ui-ux-pro-max`, `ui-styling`, `design`, `banner-design`, `design-system`)**:
   - Automatically trigger and apply modern, anti-AI-slop design principles.
   - Maintain brand consistency: Saloka Indonesian UMKM Green (`#006E24` / `#2DB24A`), Pure White (`#FFFFFF`), Light Slate (`#F8FAFC`), and clean Tokopedia/modern marketplace layout standards.
   - Clean typography, high contrast, responsive mobile/tablet/desktop aspect ratios.
   - No generic/murky dark themes unless explicitly requested.

2. **Debugging & Logic Tasks (`systematic-debugging`, `verification-before-completion`)**:
   - Always investigate root causes thoroughly before applying fixes.
   - Always run `npm run build` to verify 0 errors before committing or claiming completion.
   - Automatically commit and push working changes to `origin master`.

