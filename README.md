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

3. **Merge the feature branch into `main`**

   - Once your PR is reviewed, merge it into `main`. The `.changeset` file must be present in `main` for the next step.

4. **Automatic version bump and publish**

   - When changes are pushed to `main`, GitHub Actions will automatically:

     - Build the package
     - Apply version bumps based on the `.changeset` file
     - Update the changelog
     - Publish the new version to npm as [`@rm-hull/use-local-storage`](https://www.npmjs.com/package/@rm-hull/use-local-storage)

5. **That’s it!** 🎉
   Your package is now live on npm with an updated version and changelog.

---

### 🧠 Notes

- The npm publish step is automated via GitHub Actions (`.github/workflows/release.yml`).
- Ensure your `NPM_TOKEN` secret is configured in the repository settings under **Settings → Secrets → Actions**.
- Changesets should always be created on feature branches, not directly on `main`.
- No pull requests are created for version bumps; merging your feature branch into `main` triggers the release automatically.
