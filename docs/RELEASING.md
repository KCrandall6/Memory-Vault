# Releasing Memory Vault

Memory Vault releases are published from the source repository by pushing a matching `v`-prefixed version tag. The release workflow builds the Windows NSIS installer from the exact tagged source commit and publishes a public GitHub Release to `KCrandall6/Memory-Vault-Releases`.

## Release process

1. Update `package.json` to the intended version in a normal pull request.
2. Merge the intended release code into `main`.
3. Confirm the Windows CI workflow is green on `main`.
4. Create a source tag that exactly matches the package version with a leading `v`, such as `v0.1.0` for package version `0.1.0`.
5. Push that tag to the Memory Vault source repository.
6. The release workflow publishes the GitHub Release to `KCrandall6/Memory-Vault-Releases`.

## Required release invariants

- The source tag must match `package.json` exactly after adding the leading `v`.
  - `package.json` version `0.1.0` and tag `v0.1.0` is valid.
  - `package.json` version `0.1.0` and tag `v0.1.1` fails.
  - `package.json` version `0.1.0` and tag `release-0.1.0` does not trigger the release workflow.
- The tagged commit must be contained in `origin/main`. Older commits are allowed if they are genuinely part of `main` history.
- The source repository must have an Actions repository secret named `RELEASES_TOKEN`.
- `RELEASES_TOKEN` must be a fine-grained token scoped to `KCrandall6/Memory-Vault-Releases` with Contents read/write permission.
- Never commit, print, inspect, or expose the token value. Reference only `${{ secrets.RELEASES_TOKEN }}` in GitHub Actions.

## Expected release assets

The release workflow verifies that the Electron Builder output directory contains the installation and updater files needed for the release:

- the Windows NSIS `.exe` installer
- `latest.yml`
- the installer `.exe.blockmap`

## Token failures

If `RELEASES_TOKEN` is missing, expired, or does not have sufficient permission to write to `KCrandall6/Memory-Vault-Releases`, the build can complete but the publish step will fail with an authentication, authorization, or repository access error from Electron Builder or the GitHub API. Fix the repository secret or token permissions, then rerun the failed workflow for the same tag only if no release was published.

## Mistaken tags

If a mistaken source tag was pushed and the release workflow failed before publishing a release, delete the incorrect tag locally and remotely, then create and push the corrected tag:

```sh
git tag -d v0.1.0
git push origin :refs/tags/v0.1.0
git tag v0.1.0 <correct-commit>
git push origin v0.1.0
```

Do not reuse or move an already published version tag. If a release was published, create a new package version and a new matching source tag instead.

## User-controlled application updates

Version `0.1.1` is the first Memory Vault release that contains the application updater. Version `0.1.0` cannot update itself because it does not contain updater functionality.

Memory Vault uses Electron Builder's generated `app-update.yml` from the existing GitHub publish configuration. The installed application reads public release metadata from `KCrandall6/Memory-Vault-Releases`; no application-side `RELEASES_TOKEN`, `GH_TOKEN`, or other publishing credential is packaged or required.

Updater policy:

- Real update checks run only in installed packaged Windows NSIS builds.
- Portable builds should be updated manually by downloading a newer portable package.
- Development mode returns an unsupported state and does not make live update requests.
- Memory Vault checks quietly about once every seven days after startup and renderer initialization.
- Manual checks are always available from Vault Settings and bypass the weekly throttle.
- Automatic downloads are off.
- Auto-install-on-quit is off.
- Forced updates and lockouts are not supported.
- Updates are installed only after the user clicks Restart and Install and confirms the restart.
- The updater stores only `lastUpdateCheckAt` in the existing `memory-vault-settings.json` file under Electron `userData`; it does not write to the selected Memory Vault Library, `memoryvault.db`, archive folders, media, thumbnails, collections, people, tags, notes, backups, shareable copies, or first-run selection state.

Update state is owned by the Electron main process in `electron/updater.ts`. The renderer receives sanitized serializable state through narrow IPC channels exposed by preload: `updates:get-state`, `updates:check`, `updates:download`, `updates:quit-and-install`, and `updates:state-changed`. The preload bridge exposes only typed updater methods and a cleanup-returning state subscription; it does not expose `ipcRenderer` or generic channel access.

Unsigned build limitation: this project does not add code-signing credentials in the updater PR. Test and release reviewers should expect normal Windows unsigned-app warnings until code signing is configured; do not disable updater validation or add custom verification bypasses to work around unsigned test builds.

### First real updater test sequence

1. Merge the updater PR.
2. Confirm `main` CI is green.
3. Publish and install `v0.1.1` manually.
4. Create a test Memory Vault Library or use a safe test library.
5. Add several test memories and metadata.
6. Create a small visible `v0.1.2` change in a later PR.
7. Merge and publish `v0.1.2`.
8. Open installed `v0.1.1`.
9. Confirm the weekly or manual check detects `v0.1.2`.
10. Click Download Update.
11. Confirm progress is shown.
12. Click Restart and Install.
13. Confirm the app reports `v0.1.2`.
14. Confirm the existing library, database, metadata, and files remain intact.
