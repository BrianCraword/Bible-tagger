<#
  Tier 0 static checks. Reports; never blocks. Always exits 0.
  These check that code is well-formed. They do NOT check that it works —
  nothing here boots Discourse.
#>
param([string] $JobId = '')

$ErrorActionPreference = 'SilentlyContinue'
$root = (git rev-parse --show-toplevel 2>$null)
if (-not $root) { $root = (Get-Location).Path }
$root = $root -replace '/', '\'
$lines = @()
function Say($t) { Write-Host $t; $script:lines += $t }

Say ""
Say "TIER 0 STATIC CHECKS"
Say "These verify form, not behavior. No Discourse instance has run this code."
Say ""

$changed = git diff --name-only HEAD 2>$null
if (-not $changed) { $changed = git diff --name-only --cached 2>$null }
if (-not $changed) { Say "No changed files detected; checking the whole repo." }

function Target($ext) {
    if ($changed) { $changed | Where-Object { $_ -like "*$ext" } }
    else { Get-ChildItem $root -Recurse -Filter "*$ext" -File |
           Where-Object { $_.FullName -notmatch '\\(node_modules|\.git)\\' } |
           ForEach-Object { $_.FullName } }
}

# --- Ruby ---------------------------------------------------------------
$rb = @(Target '.rb')
if ($rb.Count -gt 0) {
    if (Get-Command ruby -ErrorAction SilentlyContinue) {
        foreach ($file in $rb) {
            $p = if (Test-Path $file) { $file } else { Join-Path $root $file }
            if (-not (Test-Path $p)) { continue }
            $out = ruby -c $p 2>&1
            if ($LASTEXITCODE -ne 0) { Say "FAIL  ruby -c  $file"; Say "      $out" }
            else { Say "ok    ruby -c  $file" }
        }
    } else {
        Say "SKIP  ruby not on PATH - $($rb.Count) .rb file(s) unchecked"
    }
    # reserved-name trap
    foreach ($file in $rb) {
        $p = if (Test-Path $file) { $file } else { Join-Path $root $file }
        if (-not (Test-Path $p)) { continue }
        if (Select-String -Path $p -Pattern '^\s*def\s+(session|status)\s*(\(|$)' -Quiet) {
            Say "FAIL  reserved Rails method name (session/status) in $file - causes a silent 404"
        }
    }
}

# --- JS / GJS -----------------------------------------------------------
# node --check is NOT used: it reports false failures on .gjs decorators.
$js = @(Target '.js') + @(Target '.gjs')
foreach ($file in $js) {
    $p = if (Test-Path $file) { $file } else { Join-Path $root $file }
    if (-not (Test-Path $p)) { continue }
    $text = Get-Content $p -Raw
    $open  = ([regex]::Matches($text, '\{')).Count
    $close = ([regex]::Matches($text, '\}')).Count
    if ($open -ne $close) { Say "FAIL  brace imbalance ($open open / $close close) in $file" }
    else { Say "ok    braces   $file" }
}

# --- JSON ---------------------------------------------------------------
foreach ($name in @('about.json', 'package.json')) {
    $p = Join-Path $root $name
    if (Test-Path $p) {
        try { Get-Content $p -Raw | ConvertFrom-Json | Out-Null; Say "ok    json     $name" }
        catch { Say "FAIL  invalid JSON in $name - $($_.Exception.Message)" }
    }
}

# --- repo linters -------------------------------------------------------
$pkg = Join-Path $root 'package.json'
if (Test-Path $pkg) {
    $json = Get-Content $pkg -Raw | ConvertFrom-Json
    if ($json.scripts.lint) { Say "TODO  this repo defines 'npm run lint' - run it" }
}
if (Test-Path (Join-Path $root '.rubocop.yml')) {
    Say "TODO  this repo has .rubocop.yml - run 'bundle exec rubocop' if bundler is set up"
}

Say ""
Say "Tier 0 complete. FAIL lines are real. Absence of FAIL means well-formed, not working."
Say ""

if ($JobId) {
    $d = Join-Path $root ".factory\jobs\$JobId"
    if (Test-Path $d) { $lines | Set-Content (Join-Path $d 'checks.md') -Encoding UTF8 }
}
exit 0