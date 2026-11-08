# Publish the web app and GitHub together

Public source: https://github.com/rodrigosouzah/financas-web
Live app: https://financas-rodrigo-web.jammypark15.chatgpt.site

GitHub stores application code only. The live app's audience, authentication, D1 records and user profiles remain separate. Do not publish the native app checkout, user data, Excel files, backups, credentials, local runtime state or private audits.

For every release:

1. Update the web version and service-worker cache version, run the appropriate tests and type check.
2. Use the installed Sites skill's source helper to build, commit, push and package this isolated checkout. Keep credentials in session stdin only. Reuse `.openai/hosting.json`'s Site ID and preserve the existing access policy.
3. Mirror that exact source to the public GitHub repository before declaring the release complete. If Git is signed in, use the `github` remote and verify its source tree. Otherwise use the connected GitHub Git Data tools. `scripts/prepare-public-snapshot.py --commit <source-sha> --output .private-audits/public-snapshot` checks tracked source and prepares bounded chunks without reading runtime files. Create binary blobs with base64; create the full tree with text content plus those blob SHAs. Verify the resulting tree SHA equals the source tree SHA. Create a commit against the current GitHub main head and update main with an expected-head lease; never force over unrelated work. GitHub commit IDs may differ, but source trees must match.
4. Save the exact Sites source commit with its unchanged build archive and deploy using the operation appropriate to the current audience. For a shared Site, use ordinary save/deploy; do not change access to allow publication.
5. Confirm successful deployment and verify the public repository's tree. Record Site version, source/GitHub commits, tree SHA and deployment outcome outside this public checkout. If either destination fails, report the partial result and complete the missing publication before claiming both are updated.

Editing local files alone does not publish. No background watcher or personal access token is required. Future maintenance must include both destinations in the same release workflow.
