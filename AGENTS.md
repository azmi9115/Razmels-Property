<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:vps-deployment-rules -->
# Deployment & VPS Rules

- The live site (razmels.com) is hosted on a VPS and DOES NOT use Vercel or auto-deployment.
- Pushing to GitHub does NOT update the live site.
- To deploy updates, you MUST SSH into the VPS (`ssh aril@100.68.41.84`), pull the correct branch, and rebuild the docker container (`docker compose up -d --build`).
- **CRITICAL WORKFLOW**: Whenever the user asks for a new feature or modification, you MUST test and display it on `localhost` first. ONLY deploy to the VPS after the user explicitly reviews and approves the local preview.
- If the Docker build fails due to Google Fonts timeout (`Failed to fetch Geist from Google Fonts`), do NOT assume it's a code error. This is a known VPS network issue (see TROUBLESHOOTING.md). Simply run the build command again.
- Always check the user's current branch locally and on the VPS before assuming they are on `main`. The live site may be tracking a different branch (e.g. `fitur-verifikasi-mutasi`).
<!-- END:vps-deployment-rules -->
