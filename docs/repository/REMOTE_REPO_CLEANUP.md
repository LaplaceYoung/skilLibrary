# Remote Repository Cleanup

Current local directory does not include a `.git` folder, so remote cleanup cannot be executed directly from this workspace yet.

Use the steps below after attaching this project to a real Git repository.

## 1) Initialize and bind remote (if needed)

```bash
git init
git add .
git commit -m "chore: initialize agent-skill-forge"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## 2) Clean tracked artifacts

```bash
git rm -r --cached dist node_modules .npm-cache docs/reports/lint temp_skills
git add .gitignore
git commit -m "chore: clean tracked generated artifacts"
git push
```

## 3) Recommended branch protection

- Protect `main` from force-push.
- Require at least one PR review.
- Require `npm run lint` and `npm run build` checks before merge.

## 4) Standard PR checklist

- `npm run lint` passes.
- `npm run build` passes.
- README and docs are updated for feature or structure changes.
- No generated artifacts are included in the diff.
