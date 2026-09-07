$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

Write-Host '=== StudyMate - Auto Setup ===' -ForegroundColor Cyan

function Test-CommandAvailable($name) {
    return $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

if (-not (Test-CommandAvailable 'node')) {
    Write-Host 'Chua tim thay Node.js.' -ForegroundColor Yellow
    if (Test-CommandAvailable 'winget') {
        $installNode = Read-Host 'Tu dong cai Node.js LTS bang winget? (Y/N)'
        if ($installNode -match '^[Yy]$') {
            winget install --id OpenJS.NodeJS.LTS --exact --source winget
            Write-Host 'Hay dong cua so nay, mo PowerShell moi, sau do chay lai setup.bat.' -ForegroundColor Yellow
            Read-Host 'Nhan Enter de thoat'
            exit 0
        }
    }
    Write-Host 'Hay cai Node.js LTS tai https://nodejs.org roi chay lai setup.bat.' -ForegroundColor Red
    Read-Host 'Nhan Enter de thoat'
    exit 1
}

Write-Host 'Dang cai thu vien...' -ForegroundColor Gray
npm install

if (-not (Test-Path '.env')) {
    Copy-Item '.env.example' '.env'
}

$envContent = Get-Content '.env' -Raw
if ($envContent -match 'OPENAI_API_KEY=sk-your-key-here' -or $envContent -notmatch 'OPENAI_API_KEY=.+') {
    Write-Host ''
    Write-Host 'Can API key OpenAI de chatbot, flashcard va ke hoach hoat dong.' -ForegroundColor Yellow
    Write-Host 'Key se duoc luu trong file .env tren may nay, khong dua vao frontend.' -ForegroundColor Gray
    $secureApiKey = Read-Host 'Dan OpenAI API key (sk-...)' -AsSecureString
    $apiKeyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureApiKey)
    try {
        $apiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($apiKeyPointer)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($apiKeyPointer)
    }
    if ([string]::IsNullOrWhiteSpace($apiKey) -or $apiKey -notmatch '^sk-') {
        Write-Host 'API key khong hop le. Chay lai setup.bat khi ban co key.' -ForegroundColor Red
        Read-Host 'Nhan Enter de thoat'
        exit 1
    }
    $envContent = [regex]::Replace($envContent, 'OPENAI_API_KEY=.*', "OPENAI_API_KEY=$($apiKey.Trim())")
    Set-Content -Path '.env' -Value $envContent -Encoding utf8
}

Write-Host ''
Write-Host 'Setup hoan tat. Dang khoi dong StudyMate...' -ForegroundColor Green
Write-Host 'Mo trinh duyet tai http://localhost:3000' -ForegroundColor Cyan
npm start
