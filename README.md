# use-local-storage

## 🧾 Releasing a New Version

This project uses [**Changesets**](https://github.com/changesets/changesets) to manage versioning and automated npm publishing.

### 🚀 How the release process works

1. **Create a changeset on your feature branch**

   When you’ve made changes you want to release, first create a new branch (not on `main`):

   ```bash
   git checkout -b feature/my-change
   ```

   Make your changes, then run:

   ```bash
   yarn changeset
   ```

   You’ll be prompted to:

   - Choose the type of version bump (patch, minor, or major)
   - Write a short summary of the change

   This command creates a markdown file in the `.changeset/` directory describing your upcoming release.

2. **Commit and push your feature branch**

   ```bash
   git add .changeset
   git commit -m "Add changeset for upcoming release"
   git push -u origin feature/my-change
   ```

3. **Open a Pull Request into `main`**

   The PR should include your code changes and the changeset file. The GitHub Action will detect the changeset and automatically open a **Version Packages** PR. This PR:

   - Updates the version in `package.json`
   - Updates the changelog
   - Prepares the release

4. **Merge the Version Packages PR**

   Once merged into `main`, the workflow will:

   - Build the package
   - Publish the new version to npm as [`@rm-hull/use-local-storage`](https://www.npmjs.com/package/@rm-hull/use-local-storage)

5. **That’s it!** 🎉
   Your package is now live on npm with an updated version and changelog.

---

### 🧠 Notes

- The npm publish step is automated via GitHub Actions (`.github/workflows/release.yml`).
- Ensure your `NPM_TOKEN` secret is configured in the repository settings under **Settings → Secrets → Actions**.
- Only maintainers with permission to publish to npm should merge the Version Packages PR.
- Changesets should always be created on feature branches, not directly on `main`.
