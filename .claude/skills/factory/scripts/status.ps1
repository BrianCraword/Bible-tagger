# Prints the factory state for this repo. Always exits 0.
$ErrorActionPreference = 'SilentlyContinue'
$root = (git rev-parse --show-toplevel 2>$null)
if (-not $root) { $root = (Get-Location).Path }
$root = $root -replace '/', '\'
$f = Join-Path $root '.factory'

Write-Host ""
Write-Host "FACTORY  $(Split-Path -Leaf $root)" -ForegroundColor Cyan
Write-Host ("branch   " + (git rev-parse --abbrev-ref HEAD 2>$null))
$dirty = git status --porcelain 2>$null
if ($dirty) { Write-Host "tree     DIRTY - clean before starting a job" -ForegroundColor Yellow }
else        { Write-Host "tree     clean" -ForegroundColor Green }

Write-Host ""
Write-Host "JOBS"
$jobsDir = Join-Path $f 'jobs'
if (Test-Path $jobsDir) {
    $jobs = Get-ChildItem $jobsDir -Directory | Sort-Object Name -Descending
    if ($jobs) {
        foreach ($j in $jobs) {
            $status = 'spec'
            if (Test-Path (Join-Path $j.FullName 'approval.md')) { $status = 'decided' }
            elseif (Get-ChildItem $j.FullName -Filter 'review-*.md') { $status = 'review' }
            elseif (Test-Path (Join-Path $j.FullName 'build.md')) { $status = 'built' }
            elseif (Test-Path (Join-Path $j.FullName 'spec.md')) { $status = 'spec' }
            $branch = git rev-parse --verify --quiet ("factory/" + $j.Name) 2>$null
            $mark = if ($branch) { 'branch' } else { '      ' }
            "{0,-10} {1,-8} {2}" -f $status, $mark, $j.Name | Write-Host
        }
    } else { Write-Host "  none" }
} else { Write-Host "  none" }

Write-Host ""
Write-Host "BACKLOG"
$backlog = Join-Path $f 'backlog.md'
if (Test-Path $backlog) {
    $open = Get-Content $backlog | Where-Object { $_ -match '^\s*-\s*\[\s\]' }
    if ($open) { $open | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" } }
    else { Write-Host "  empty" }
} else { Write-Host "  no backlog.md" }

Write-Host ""
Write-Host "WORKTREES"
git worktree list 2>$null | ForEach-Object { Write-Host "  $_" }
Write-Host ""
exit 0