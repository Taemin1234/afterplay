param(
  [string]$EnvFile = ".env.migration",
  [switch]$IncludeAuthAndStorage
)

$ErrorActionPreference = "Stop"

function Get-EnvValue {
  param(
    [string]$FilePath,
    [string]$Key
  )

  if (!(Test-Path $FilePath)) {
    throw "Env file not found: $FilePath"
  }

  $line = Get-Content $FilePath | Where-Object { $_ -match "^\s*$Key\s*=" } | Select-Object -First 1
  if (!$line) {
    throw "Missing required key '$Key' in $FilePath"
  }

  $value = $line -replace "^\s*$Key\s*=\s*", ""
  $value = $value.Trim()
  if ($value.StartsWith('"') -and $value.EndsWith('"')) {
    $value = $value.Substring(1, $value.Length - 2)
  } elseif ($value.StartsWith("'") -and $value.EndsWith("'")) {
    $value = $value.Substring(1, $value.Length - 2)
  }

  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "Key '$Key' is empty in $FilePath"
  }

  return $value
}

$oldDirectUrl = Get-EnvValue -FilePath $EnvFile -Key "OLD_DIRECT_URL"
$newDirectUrl = Get-EnvValue -FilePath $EnvFile -Key "NEW_DIRECT_URL"

$pgDumpCandidates = @(
  "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
  "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
)
$pgRestoreCandidates = @(
  "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe",
  "C:\Program Files\PostgreSQL\16\bin\pg_restore.exe"
)

$pgDump = $pgDumpCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
$pgRestore = $pgRestoreCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (!$pgDump) { throw "pg_dump not found in expected paths." }
if (!$pgRestore) { throw "pg_restore not found in expected paths." }

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path (Get-Location) "backup"
if (!(Test-Path $backupDir)) {
  New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$dumpFile = Join-Path $backupDir "supabase-migration-$timestamp.dump"

$dumpArgs = @(
  "--format=custom",
  "--no-owner",
  "--no-privileges",
  "--dbname=$oldDirectUrl",
  "--file=$dumpFile"
)

if ($IncludeAuthAndStorage) {
  $dumpArgs += @("--schema=public", "--schema=auth", "--schema=storage")
} else {
  $dumpArgs += @("--schema=public")
}

Write-Host "[1/2] Dumping old project to: $dumpFile"
& $pgDump @dumpArgs
if ($LASTEXITCODE -ne 0) {
  throw "pg_dump failed with exit code $LASTEXITCODE"
}

$restoreArgs = @(
  "--clean",
  "--if-exists",
  "--no-owner",
  "--no-privileges",
  "--dbname=$newDirectUrl",
  $dumpFile
)

Write-Host "[2/2] Restoring dump to new project"
& $pgRestore @restoreArgs
if ($LASTEXITCODE -ne 0) {
  throw "pg_restore failed with exit code $LASTEXITCODE"
}

Write-Host ""
Write-Host "Migration completed."
Write-Host "Dump file: $dumpFile"
