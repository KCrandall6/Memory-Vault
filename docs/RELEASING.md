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
