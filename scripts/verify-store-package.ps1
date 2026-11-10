param(
    [Parameter(Mandatory = $true)][string]$PackagePath
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$package = (Resolve-Path -LiteralPath $PackagePath).Path
$destination = Join-Path ([IO.Path]::GetTempPath()) ("memory-vault-appx-" + [guid]::NewGuid())
try {
    [IO.Compression.ZipFile]::ExtractToDirectory($package, $destination)
    [xml]$manifest = Get-Content -LiteralPath (Join-Path $destination 'AppxManifest.xml') -Raw
    if ($manifest.Package.Identity.Name -ne 'MemoryVault.StoreTest' -or
        $manifest.Package.Identity.Publisher -ne 'CN=MemoryVault Store Test' -or
        $manifest.Package.Identity.ProcessorArchitecture -ne 'x64') {
        throw 'Unexpected experimental package identity or architecture.'
    }
    if ($manifest.Package.Dependencies.TargetDeviceFamily.MinVersion -ne '10.0.19041.0') {
        throw 'Unexpected minimum Windows version.'
    }
    $capabilities = @($manifest.Package.Capabilities.ChildNodes | Where-Object { $_.NodeType -eq 'Element' })
    if ($capabilities.Count -ne 1 -or $capabilities[0].Name -ne 'runFullTrust') {
        throw 'Unexpected package capabilities.'
    }
    if ($manifest.Package.Applications.Application.EntryPoint -ne 'Windows.FullTrustApplication') {
        throw 'The experiment must remain a full-trust desktop app.'
    }
    $exe = Join-Path $destination $manifest.Package.Applications.Application.Executable
    Write-Host ("Manifest Application.Executable: {0}" -f $manifest.Package.Applications.Application.Executable)
    Write-Host ("Resolved executable path: {0}" -f $exe)
    Write-Host 'Extracted package root entries:'
    Get-ChildItem -LiteralPath $destination -Force | ForEach-Object { Write-Host ("  {0}" -f $_.FullName) }
    Write-Host 'Extracted executable files:'
    $executables = @(Get-ChildItem -LiteralPath $destination -Filter '*.exe' -Recurse -File)
    $executables | ForEach-Object { Write-Host ("  {0}" -f $_.FullName) }
    if ($env:GITHUB_ACTIONS -eq 'true') {
        $details = "Manifest=$($manifest.Package.Applications.Application.Executable); resolved=$exe; packaged EXEs=$($executables.FullName -join '; ')"
        $details = $details.Replace('%', '%25').Replace("`r", '%0D').Replace("`n", '%0A')
        Write-Host "::notice title=AppX executable paths::$details"
    }
    if (-not (Test-Path -LiteralPath $exe)) { throw 'Packaged application executable is missing.' }
    foreach ($asset in @('StoreLogo.png', 'Square44x44Logo.png', 'Square150x150Logo.png', 'Wide310x150Logo.png')) {
        if (-not (Test-Path -LiteralPath (Join-Path $destination ("assets/" + $asset)))) {
            throw "Missing asset: $asset"
        }
    }
    $env:MEMORY_VAULT_PACKAGE_RESOURCES = Join-Path $destination 'app/resources'
    node scripts/verify-store-payload.cjs
    if ($LASTEXITCODE -ne 0) { throw 'Store payload verification failed.' }
    Write-Host "AppX structure verified: $package"
    Write-Host 'This does not verify signing, Windows installation, application behavior, or Store certification.'
} finally {
    Remove-Item Env:MEMORY_VAULT_PACKAGE_RESOURCES -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $destination) { Remove-Item -LiteralPath $destination -Recurse -Force }
}
