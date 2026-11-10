# Experimental Microsoft Store feasibility

This is a packaging proof of concept, not a production migration or a Store
submission. The candidate is a **full-trust Windows desktop AppX**, not a UWP
rewrite. AppX is the smallest target supported by the existing builder. It uses
the Windows package deployment model also used by MSIX; changing the filename
to .msix is not a conversion.

## Findings and scope

| Item | Inspected implementation / decision |
| --- | --- |
| Toolchain | Node 20; lockfile resolves Electron **30.5.1**, electron-builder **24.13.3**, better-sqlite3 **11.10.0**, Sharp **0.33.5**, electron-updater **6.3.9**. |
| Existing packaging | Both package.json build settings and electron-builder.json5 exist and differ (app ID, output directory, file inclusions). The experiment explicitly loads electron-builder.store-test.cjs, with no implicit parent config. Existing configuration and build commands are preserved. |
| Smallest route | Existing builder's Windows AppX target, x64 only. No Electron/framework upgrade, new dependencies, Azure services, licensing, or app-version change. |
| Storage | electron/storage-root.cjs stores the selected absolute library path in memory-vault-settings.json under Electron userData. Database and archive live in that selected library, outside the app installation. |
| Database | electron/database.cjs opens better-sqlite3 lazily, creates the schema from resources/create-database.sql, and enables foreign keys. The Store config explicitly includes that SQL resource. |
| Imports | electron/file-handler.js copies selected files using Node fs and stores library-relative archive paths. It does not currently call electron/media-utils.js's Sharp/FFmpeg helper. Legacy absolute media paths are still accepted. |
| Updates | Previously every packaged non-portable Windows build qualified for GitHub updates. Store metadata or process.windowsStore now blocks loading/configuring electron-updater, startup scheduling, checks, downloads and installation. NSIS retains its existing policy and consent flow. |
| Native modules | Builder rebuilds native dependencies for the Electron target. SQLite, Sharp and @img binaries are unpacked from ASAR. Windows CI checks native-file presence and x64 PE headers, not DLL loading. |

The unchanged NSIS, portable and release commands do not read the Store config
and receive no Store distribution marker. Neither existing workflow is edited.
The Store runner always passes --publish never, configures publish: null,
disables signing discovery, and removes release certificate variables from its
child environment. The new workflow has read-only repository permissions and no
release credentials. It only uploads a short-lived Actions artifact.

## Identity, manifest and artwork

| Field | Experimental value | Before any Store submission |
| --- | --- | --- |
| Identity.Name | MemoryVault.StoreTest | Replace with the exact Package/Identity/Name from the reserved Partner Center product. |
| Identity.Publisher | CN=MemoryVault Store Test | Replace with the exact Partner Center publisher subject, normally CN=<publisher GUID>. It must also match the signing certificate subject for sideloading. |
| PublisherDisplayName | Memory Vault (Development) | Replace with the registered publisher display name. |
| Application.Id | MemoryVault | Stable manifest application ID; together with the package family name it forms the application user model ID. It is not the Store product ID or the Electron appId. |
| DisplayName | Memory Vault Store Test | Experimental label. Final listing/display names must comply with the reserved product and branding. |
| Version | 0.1.1.0 from unchanged app version 0.1.1 | Package updates need an increasing four-part version with the same identity/publisher. Store submissions reserve the fourth component as zero. |
| Architecture | x64 | ARM64/32-bit packages are outside this experiment; every native binary must match any future additional target. |
| OS floor | Windows.Desktop 10.0.19041.0 | Deliberately scoped to Windows 10 2004+ / Windows 11; this is a declared requirement, not a tested compatibility matrix. |

Builder 24.13.3 hardcodes 10.0.14316.0 in its AppX template. The supported
appxManifestCreated hook replaces that floor and MaxVersionTested with
10.0.19041.0, fails if the expected template changes, and saves the resulting
manifest beside the artifact. MaxVersionTested is manifest metadata, not proof
that an OS was tested.

The standard template emits Windows.FullTrustApplication and restricted
runFullTrust capability. There is no startup task, broadFileSystemAccess,
removableStorage, admin elevation, custom protocol or file association.
runFullTrust needs a justified desktop-app use case during Store review.
Do not add UWP filesystem capabilities merely to work around a failed file test:
first diagnose the full-trust process's path, ACLs, package virtualization and
drive availability.

Four appropriately sized PNG assets are generated from the existing logo into
ignored build/store-test/appx. These replace builder sample artwork. Partner
Center listing screenshots, high-resolution artwork, accessibility, naming and
visual-quality review remain separate work.

## Filesystem and data implications

An AppX full-trust desktop process retains Win32/Node filesystem APIs and the
current user's ACL permissions. It does not become an AppContainer/UWP app
requiring a brokered picker for every access. That makes the existing Node fs,
SQLite and Electron file-dialog architecture a plausible fit, but it does not
prove every path works in an installed package.

* **Installation directory:** Windows owns the versioned package directory,
  usually under WindowsApps. Treat it as read-only. Do not write a library,
  database, logs or settings beside process.execPath. The current selected-library
  flow writes outside it. Legacy discovery also probes the executable directory;
  do not rely on that probe to migrate an NSIS library into the package.
* **Selected SQLite library:** An ordinary user-writable location outside the
  package/private app data should remain directly accessible. SQLite sidecars,
  journaling, locking and rename permissions must work on that volume too.
  Test NTFS and a representative external-drive filesystem such as exFAT. Network
  filesystems and simultaneous writers are not newly supported by this experiment.
* **USB media:** Full trust should permit reads/writes to mounted drives within
  the user's permissions. There is no promise of stable drive letters or access
  while a drive is disconnected. Re-select the library if its absolute path
  changes. Never test destructive operations against the only copy of a library.
* **userData settings:** Keep app.getPath('userData'); do not introduce a hardcoded
  Store path. Packaged desktop AppData reads/writes may be redirected or merged
  with a per-package view. Exact behavior varies with Windows version and manifest
  virtualization settings. Record the path reported by Vault Settings and compare
  its effective on-disk location before/after upgrade and uninstall. Expect a
  separate Store selection/settings state; existing NSIS settings are not
  guaranteed to migrate or remain isolated without testing.
* **Absolute paths:** Existing absolute library paths and legacy absolute media
  paths still resolve through Node/Electron. They depend on ACLs and drive
  mappings; packaging does not make them portable. Relative archive paths continue
  to resolve against the selected library root.
* **Upgrade/uninstall:** Package binaries are replaced on upgrade. Windows normally
  retains package app data on upgrade and removes managed package data on uninstall.
  A library outside those managed locations should survive uninstall; settings
  may not. That must be verified with a scratch library, including co-installed
  NSIS behavior. Libraries deliberately placed inside private package app data
  do not have the same retention expectation.
* **Disconnected/wrong volume:** Existing ensureStorageRoot can create missing
  directories, and library identity is based on an absolute path rather than
  a physical volume ID. Startup rejects an unrecognizable configured library,
  but later operations and a reused drive letter still need acceptance tests.
  Any corruption, silent empty-library replacement or writes to the wrong volume
  is a release blocker requiring separate storage work, not a packaging workaround.

Native addons are not inherently excluded from a full-trust package. The
unpacked .node/DLL files must load under Electron's ABI and Windows DLL search
rules without writing to the installation directory. Sharp's Windows @img
package includes libvips DLLs. Test on a clean VM with no developer tools or
globally installed runtimes to expose missing runtime dependencies.
The dormant FFmpeg helper does not bundle ffmpeg/ffprobe executables; do not
claim video metadata/transcoding works merely because those helpers compile.
Ordinary import copying and Chromium media playback need their own tests,
including format/codec availability and third-party license review.

## Build and artifact inspection on Windows

Use a disposable Windows 11 x64 VM (and a supported Windows 10 target if that is
part of the intended product matrix), Node 20, npm, and the Windows SDK signing
tools. Native rebuilds may require Visual Studio C++ Build Tools/Python if a
matching prebuilt binary is unavailable. Use the existing checkout; no worktree
is required.

```powershell
npm ci
npm run lint
npm run verify:store
npm run build:store:test
if ($LASTEXITCODE -ne 0) { throw 'Store build failed' }
$packages = @(Get-ChildItem release/store-test/*.appx)
if ($packages.Count -ne 1) { throw 'Expected exactly one AppX' }
./scripts/verify-store-package.ps1 -PackagePath $packages[0].FullName
```

The artifact is intentionally unsigned. AppX packing uses builder's MakeAppx
toolchain on Windows; the runner exits with an explanatory error on Linux.
The experimental workflow runs on pull requests touching relevant paths, or
manually through workflow_dispatch after it is available on the default branch.
Download memory-vault-store-test-x64-unsigned from the Actions run. No Store or
GitHub Releases upload occurs.

verify-store-package.ps1 extracts only into a new temporary directory and checks
the manifest, assets, executable, ASAR metadata/schema/main/preload, absence of
GitHub update configuration, and unpacked x64 native bindings. It cleans only
that temporary directory. Passing this check is **package structure validation**,
not a successful installation or a native-module runtime test.

The verifier uses the Windows SDK MakeAppx.exe unpacker (discovered from PATH or
the newest installed x64 SDK; override with -MakeAppxPath if necessary).
Do not substitute System.IO.Compression.ZipFile extraction: AppX package part
names are URI encoded. In the first Windows CI build, the manifest declared
app\Memory Vault.exe, while raw ZIP extraction produced
app\Memory%20Vault.exe. That caused a false executable-missing result. MakeAppx
unpack restores the logical deployment filenames; the verifier still requires
the manifest's exact executable path to exist as a file. This was a verification
extraction issue, not evidence of a missing application executable.

## Local certificate, signing and installation

These are manual development operations, not CI or production signing. Use a
test VM and scratch libraries. Install only your own test certificate; never
disable signature verification. If Windows policy prohibits trusted sideloading,
obtain the appropriate development policy from the machine administrator.
Developer Mode may help local development but does not make an unsigned AppX
trusted.

1. In a normal PowerShell session, create a test code-signing certificate whose
   subject exactly matches the experimental manifest publisher. Reuse this
   certificate for upgrade tests; no PFX export/password is needed.

   ```powershell
   $cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject 'CN=MemoryVault Store Test' -HashAlgorithm SHA256 -KeyAlgorithm RSA -KeyLength 2048 -CertStoreLocation Cert:\CurrentUser\My
   $cerPath = Join-Path $env:TEMP 'MemoryVault.StoreTest.cer'
   Export-Certificate -Cert $cert -FilePath $cerPath
   $thumbprint = $cert.Thumbprint
   ```

2. In an elevated PowerShell session, trust the **public** certificate on this
   test machine only:

   ```powershell
   Import-Certificate -FilePath (Join-Path $env:TEMP 'MemoryVault.StoreTest.cer') -CertStoreLocation Cert:\LocalMachine\TrustedPeople
   ```

3. Back in the original normal session, locate the SDK tools, sign a disposable
   copy of the artifact, verify it, and install:

   ```powershell
   $sdk = Get-ChildItem "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\signtool.exe" | Sort-Object FullName -Descending | Select-Object -First 1
   if (-not $sdk) { throw 'Install Windows SDK signing tools' }
   $signtool = $sdk.FullName
   $packages = @(Get-ChildItem release/store-test/*.appx)
   if ($packages.Count -ne 1) { throw 'Expected exactly one AppX' }
   $unsigned = $packages[0].FullName
   $signed = Join-Path $env:TEMP 'Memory-Vault-StoreTest-local-signed.appx'
   Copy-Item -LiteralPath $unsigned -Destination $signed
   & $signtool sign /fd SHA256 /s My /sha1 $thumbprint $signed
   if ($LASTEXITCODE -ne 0) { throw 'Signing failed' }
   & $signtool verify /pa /v $signed
   if ($LASTEXITCODE -ne 0) { throw 'Signature verification failed; diagnose certificate trust, do not bypass it' }
   Add-AppxPackage -Path $signed
   Get-AppxPackage -Name MemoryVault.StoreTest | Select-Object Name, Version, PackageFullName, PackageFamilyName, InstallLocation
   ```

   Launch **Memory Vault Store Test** from Start, not the unpacked executable.
   A real deployment gives Windows package identity and virtualization; running
   win-unpacked does not. On failure use the activity ID with Get-AppPackageLog
   and inspect Windows AppXDeployment-Server event logs.

4. To test an actual Windows package upgrade without changing package.json or
   the Electron app version, repack a disposable copy with a higher **manifest
   package version**. This tests replacement/data retention with identical app
   code; it does not test future schema migrations.

   ```powershell
   $makeappx = Join-Path $sdk.DirectoryName 'makeappx.exe'
   $stage = Join-Path $env:TEMP ('MemoryVault-upgrade-' + [guid]::NewGuid())
   & $makeappx unpack /p $unsigned /d $stage
   if ($LASTEXITCODE -ne 0) { throw 'Unpack failed' }
   $manifestPath = Join-Path $stage 'AppxManifest.xml'
   [xml]$manifest = Get-Content -LiteralPath $manifestPath -Raw
   $manifest.Package.Identity.Version = '0.1.2.0'
   $manifest.Save($manifestPath)
   # Remove generated footprint files only from this disposable unpacked copy.
   foreach ($name in @('AppxBlockMap.xml', '[Content_Types].xml', 'AppxSignature.p7x')) {
       $file = Join-Path $stage $name
       if (Test-Path -LiteralPath $file) { Remove-Item -LiteralPath $file }
   }
   $upgrade = Join-Path $env:TEMP 'Memory-Vault-StoreTest-upgrade.appx'
   & $makeappx pack /d $stage /p $upgrade /o
   if ($LASTEXITCODE -ne 0) { throw 'Repack failed' }
   & $signtool sign /fd SHA256 /s My /sha1 $thumbprint $upgrade
   if ($LASTEXITCODE -ne 0) { throw 'Upgrade signing failed' }
   & $signtool verify /pa /v $upgrade
   if ($LASTEXITCODE -ne 0) { throw 'Upgrade signature verification failed' }
   # Close Memory Vault before replacing its package.
   Add-AppxPackage -Path $upgrade
   Get-AppxPackage -Name MemoryVault.StoreTest | Select-Object Name, Version
   ```

   Both packages must keep the same name/publisher/application ID/architecture.
   Reinstalling the same version does not establish upgrade retention.

5. After the checklist, uninstall only this experiment:

   ```powershell
   Get-AppxPackage -Name MemoryVault.StoreTest | Remove-AppxPackage
   ```

   Do not remove library folders. In an elevated console remove only the test
   certificate you imported, using its recorded thumbprint under
   Cert:\LocalMachine\TrustedPeople. Remove its private-key certificate from
   Cert:\CurrentUser\My after all upgrade testing is complete. Never commit
   certificates, private keys or signed development packages.

## Manual acceptance record

Record OS/build, package hash/version/family name, certificate thumbprint, drive
letter/filesystem, effective userData path, and pass/fail evidence for each row.
Use disposable libraries and media; keep baseline hashes/copies. Opening an
existing library may initialize schema/default records, so use a **copy**, not
the only copy of a real archive.

- [ ] Install a correctly signed package as a standard user; Start entry launches
  with package identity. Check wrong/untrusted certificate rejection separately.
- [ ] Start with no settings; verify first-run choices, dialog cancellation,
  library creation in a writable internal-drive directory, and re-selection of
  an existing scratch library. Decline/read-only/protected paths must fail clearly.
- [ ] Import image, document, audio and video samples; verify archived bytes,
  previews/playback, metadata edits, search, downloads, collections and counts.
  Confirm no writes go into WindowsApps.
- [ ] Close/reopen; check selected library and metadata persist. With the app
  closed, check scratch database integrity using a trusted SQLite tool
  (PRAGMA integrity_check), including any journal/sidecar handling.
- [ ] Repeat library creation, selection, reads, imports, edits and downloads
  against USB media, including NTFS and exFAT if supported commercially, spaces
  and non-ASCII filenames, large files and legacy absolute-path records.
- [ ] Disconnect USB with the app closed, then while running and during a
  controlled scratch import. Verify clear errors, no hang/corruption, no silently
  recreated empty library or writes to the wrong volume. Reconnect, restart and
  verify data; test a changed/reused drive letter and explicit library re-selection.
- [ ] Check Settings reports Microsoft Store/test-package update guidance.
  GitHub update controls cannot check/download/install. Observe startup for more
  than the existing 12-second update delay; no GitHub release traffic is emitted.
- [ ] On a clean VM, verify SQLite loads and queries; explicitly exercise Sharp
  if a feature uses it. Check no missing DLL/runtime dependency. Do not equate
  copied native files or inactive helper code with a runtime pass.
- [ ] Install the higher manifest-version package over the lower one with the
  same identity/certificate. Verify Windows reports the higher package version,
  startup, settings, library selection, media hashes, database records and previews.
  Repeat with the external drive absent during upgrade, then reconnected.
- [ ] Uninstall the experiment. Verify external/internal selected libraries and
  database hashes survive; record which managed settings/cache files are removed.
  Reinstall and explicitly re-select the surviving scratch library.
- [ ] Co-install NSIS and the test package. Test one process at a time against
  scratch data; verify shortcuts/identities, settings isolation or unexpected
  sharing, and independent uninstall. NSIS still checks GitHub only under the
  existing consent policy. Do not promise concurrent database writers.
- [ ] Run Windows App Certification Kit on the signed package and record the
  full report. A local WACK pass is useful evidence, not Partner Center approval.

## Evidence, blockers and recommendation

| Validation level | Current result |
| --- | --- |
| Source inspection | Completed for packaging, storage, imports, dependencies and updater. |
| Compilation | Linux: lint, TypeScript, renderer/main/preload Vite build, existing preload/updater runtime checks passed. |
| Automated logic/config checks | Ten tests passed: Store metadata/platform guards, all update actions, NSIS consent/scheduling, existing portable/dev/non-Windows behavior, actual builder manifest generation/hook, branded asset dimensions, and build-runner tool resolution/signing isolation. Installed builder configuration loading/schema validation also passed. |
| AppX package construction | Not executed here: the available machine is Linux; installed builder supports AppX construction on Windows. The new Windows workflow is the next gate. |
| Payload inspection | Script provided for Windows CI; not executed on a real AppX here. |
| Local deployment/runtime under identity | Unverified; requires signing, trusting and installing on Windows plus the acceptance checklist. Previous ordinary Electron smoke checks are not Store-package evidence. |
| Microsoft Store certification | Not attempted or established. No submission or publication occurs in this experiment. |

Before commercial distribution:

1. Reserve the actual product in Partner Center; replace placeholders and verify
   accepted submission format, identity, publisher, versioning and signing route.
   Test identity migration separately; changing publisher/name changes package
   family, app data context and upgrade relationship.
2. Obtain a Windows CI artifact, inspect it, sign/install locally, execute the
   checklist, and run WACK. Resolve any capability justification, unsupported API,
   native loading or external-drive/data-loss failures before a Store submission.
3. Electron 30 is outside current upstream support. An upgrade is not required
   to explore this builder target, so none is included. A supported Electron and
   dependency/security review is a production-readiness gate; a successful AppX
   build does not settle Store security requirements.
4. Verify all bundled third-party licenses/notices, Chromium/media codec rights,
   privacy disclosures, accessibility, listing assets and offline behavior.
   External Adobe/jsDelivr stylesheet loads already showed errors in ordinary
   cloud Electron testing; assess packaged behavior and redistribution rights.
5. No external payment, account activation, license service or commercial
   licensing implementation was found or added. Decide Store pricing vs future
   external licensing separately. Current Store policy can distinguish desktop
   non-game commerce from other app categories; do not assume external payment
   is universally forbidden or automatically permitted. Recheck the applicable
   policy, secure-payment requirements, purchase disclosures and reviewer access
   before designing activation. No Azure hosting is required by this PoC.

**Recommendation:** proceed with the isolated AppX experiment, keep NSIS as the
working release channel, and make a production channel decision only after a
real package installs and the storage/upgrade/uninstall checks pass. If AppX
passes locally but current submission requirements demand another packaging
toolchain, evaluate a modern MSIX packaging step as a separate experiment before
considering any framework or storage redesign.

Reference documentation (recheck current requirements before submission):

- [electron-builder AppX](https://www.electron.build/appx.html)
- [Electron process.windowsStore](https://www.electronjs.org/docs/latest/api/process)
- [Packaged desktop filesystem and registry behavior](https://learn.microsoft.com/en-us/windows/msix/desktop/desktop-to-uwp-behind-the-scenes)
- [Partner Center app identity](https://learn.microsoft.com/en-us/windows/apps/publish/view-app-identity-details)
- [Create a package signing certificate](https://learn.microsoft.com/en-us/windows/msix/package/create-certificate-package-signing)
- [Sign a package with SignTool](https://learn.microsoft.com/en-us/windows/msix/package/sign-app-package-using-signtool)
- [Microsoft Store policies](https://learn.microsoft.com/en-us/windows/apps/publish/store-policies)

Implementation details were checked against the installed builder source/schema.
Live documentation requests from this machine were denied, so current policy and
Partner Center requirements remain an explicit follow-up rather than a claimed
verification.
