# Costa&Costa | PR #63 — exportacao inicial pelo PowerShell (sem WSL)
# Operacao de leitura no banco. NAO certifica backup completo.
# Armazena arquivos somente no perfil LOCAL do Windows (fora do repositorio/OneDrive).
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ProjectRef = "gclhailalyrokvmkwllm"
$LocalRoot = $env:LOCALAPPDATA
if ([string]::IsNullOrWhiteSpace($LocalRoot)) {
  throw "LOCALAPPDATA ausente: use Windows PowerShell em seu computador."
}

$DockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $DockerCmd) { throw "Docker Desktop nao encontrado. Abra-o/instale e tente novamente." }
& docker info --format "{{.ServerVersion}}"
if ($LASTEXITCODE -ne 0) { throw "Docker Desktop nao esta executando. Abra-o e tente novamente." }

$SupabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
$UseNpx = $false
if (-not $SupabaseCmd) {
  $NpxCmd = Get-Command npx.cmd -ErrorAction SilentlyContinue
  if (-not $NpxCmd) { throw "Supabase CLI nao encontrado. Instale a CLI (ou Node.js/npm para npx supabase) antes de continuar." }
  $UseNpx = $true
}
function Invoke-Supabase {
  param([string[]]$CliArgs)
  if ($script:UseNpx) {
    & npx.cmd --yes supabase @CliArgs
  } else {
    & $script:SupabaseCmd.Source @CliArgs
  }
  if ($LASTEXITCODE -ne 0) { throw "Falha na Supabase CLI (codigo $LASTEXITCODE). Exportacao incompleta: NAO utilizar para restauracao." }
}
Invoke-Supabase -CliArgs @("--version")

$Stamp = [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssZ")
$Destination = Join-Path $LocalRoot "CostaCosta\Backups\$ProjectRef\$Stamp"
New-Item -Path $Destination -ItemType Directory -Force | Out-Null
Write-Host "Destino LOCAL: $Destination" 
Write-Host "Obtenha a connection string do proprio projeto no Supabase Dashboard > Connect."
Write-Host "Nao cole a URL/senha em conversas, tickets ou arquivos versionados."
$SecureUrl = Read-Host "Connection string do Postgres (entrada oculta)" -AsSecureString
$Pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureUrl)
try { $DbUrl = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($Pointer) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Pointer) }
$SecureUrl = $null
if (($DbUrl -notmatch '^postgres(?:ql)?://') -or (-not $DbUrl.Contains($ProjectRef))) {
  $DbUrl = $null
  throw "Connection string nao e PostgreSQL ou nao corresponde ao projeto esperado. Cancelado."
}

# OBS: a CLI precisa receber a URL como argumento de processo; pode aparecer
# temporariamente na lista de processos do computador. Nao executar em maquina compartilhada.
try {
  Invoke-Supabase -CliArgs @("db","dump","--db-url",$DbUrl,"-f",(Join-Path $Destination "roles.sql"),"--role-only")
  Invoke-Supabase -CliArgs @("db","dump","--db-url",$DbUrl,"-f",(Join-Path $Destination "schema.sql"))
  Invoke-Supabase -CliArgs @("db","dump","--db-url",$DbUrl,"-f",(Join-Path $Destination "data.sql"),"--use-copy","--data-only","-x","storage.buckets_vectors","-x","storage.vector_indexes")
} finally {
  $DbUrl = $null
}
$OutputFiles = @("roles.sql","schema.sql","data.sql")
foreach ($Item in $OutputFiles) {
  $File = Join-Path $Destination $Item
  if (-not (Test-Path -LiteralPath $File) -or ((Get-Item -LiteralPath $File).Length -eq 0)) {
    throw "Dump ausente/vazio: $Item. O backup NAO esta completo."
  }
}
$Hashes = foreach ($Item in $OutputFiles) {
  $H = Get-FileHash -LiteralPath (Join-Path $Destination $Item) -Algorithm SHA256
  "$($H.Hash)  $Item"
}
$Hashes | Set-Content -LiteralPath (Join-Path $Destination "SHA256SUMS.txt") -Encoding ascii
@(
 "STATUS: EXPORTACAO LOGICA PARCIAL, NAO RESTAURADA."
 "NAO e garantia de backup completo: verificar auth.users, storage, extensoes e restauracao."
 "Copiar os bytes de todos os arquivos dos buckets, mantendo os privados protegidos."
 "Nunca enviar dumps, credenciais ou arquivos privados ao GitHub ou ao ChatGPT."
 "Nenhuma tabela foi excluida por este procedimento."
) | Set-Content -LiteralPath (Join-Path $Destination "STATUS_BACKUP.txt") -Encoding ascii

Write-Host ""
Write-Host "EXPORTACAO INICIAL FINALIZADA. Arquivos no caminho LOCAL abaixo:"
Write-Host $Destination
Write-Host "Hash SHA256 gerado. Ainda falta copiar Storage, validar Auth e testar restore."
