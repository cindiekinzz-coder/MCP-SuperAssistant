# Start the local mcp-discord HTTP server so the Gremy Discord Bridge extension
# can reach it from ChatGPT. KISS: one process, no proxy, no Cloudflare.

$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

$envFile = Join-Path $scriptDir 'bridge.env'
if (-not (Test-Path $envFile)) {
    Write-Host "No bridge.env found. Copy bridge.env.example to bridge.env and fill in DISCORD_TOKEN first." -ForegroundColor Red
    exit 1
}

# Parse .env (simple KEY=VALUE lines, ignore # comments and blank lines).
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=][^=]*)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Item -Path "env:$key" -Value $value
    }
}

if (-not $env:DISCORD_TOKEN) {
    Write-Host "DISCORD_TOKEN is empty in .env. Paste your bot token there first." -ForegroundColor Red
    exit 1
}

$mcpPath = if ($env:MCP_DISCORD_PATH) { $env:MCP_DISCORD_PATH } else { 'C:\Users\Cindy\Documents\mcp-discord' }
$mcpPort = if ($env:MCP_DISCORD_PORT) { $env:MCP_DISCORD_PORT } else { '8080' }
$entry = Join-Path $mcpPath 'build\index.js'

if (-not (Test-Path $entry)) {
    Write-Host "Cannot find $entry - check MCP_DISCORD_PATH in bridge.env." -ForegroundColor Red
    exit 1
}

Write-Host "Starting mcp-discord on http://localhost:$mcpPort/mcp ..." -ForegroundColor Cyan
Write-Host "Leave this window open. Ctrl+C to stop." -ForegroundColor DarkGray
node $entry --transport http --port $mcpPort
