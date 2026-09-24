# deploy.ps1 — build the sector pages, then push everything.
#
#   .\deploy.ps1 "what changed"
#
# The five sector folders are generated from index.html. Pushing the source
# without regenerating them leaves every /personal/, /home-services/ etc.
# page frozen at the last build — the root looks updated and the subpages
# do not. This makes that impossible to forget.

param([string]$Message = "Update site")

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# Refuse to push to the wrong repo.
$remote = (git remote get-url origin)
if ($remote -notmatch "voicecaptures\.com") {
    Write-Host "Remote is $remote — this is not the site repo. Stopping." -ForegroundColor Red
    exit 1
}

Write-Host "Building sector pages..." -ForegroundColor Cyan
python build.py
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed. Nothing pushed." -ForegroundColor Red; exit 1 }

# Every generated folder must be newer than the source, or the build silently
# did nothing and the subpages would ship stale.
$src = (Get-Item index.html).LastWriteTime
foreach ($d in @("personal","home-services","restaurants-cafes","clinics-dental","other-businesses")) {
    $f = Join-Path $d "index.html"
    if (-not (Test-Path $f)) { Write-Host "Missing $f" -ForegroundColor Red; exit 1 }
    if ((Get-Item $f).LastWriteTime -lt $src.AddSeconds(-5)) {
        Write-Host "$f is older than index.html — build did not run." -ForegroundColor Red
        exit 1
    }
}

git add -A
$staged = git diff --cached --name-only
if (-not $staged) { Write-Host "Nothing to commit." -ForegroundColor Yellow; exit 0 }

Write-Host "`nStaged:" -ForegroundColor Cyan
$staged | ForEach-Object { Write-Host "  $_" }

git commit -m $Message
git push

Write-Host "`nPushed. Give GitHub Pages a minute, then check:" -ForegroundColor Green
Write-Host "  https://voicecaptures.com/"
Write-Host "  https://voicecaptures.com/personal/"
