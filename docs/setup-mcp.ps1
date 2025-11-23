# Supabase MCP 설정 자동 적용 스크립트
# PowerShell에서 실행하세요

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Supabase MCP 설정 적용 스크립트" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Claude Desktop 설정 파일 경로
$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
$configDir = Split-Path $configPath

Write-Host "1. 설정 디렉토리 확인 중..." -ForegroundColor Yellow
if (-not (Test-Path $configDir)) {
    Write-Host "   디렉토리가 없습니다. 생성 중..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    Write-Host "   ✓ 디렉토리 생성 완료" -ForegroundColor Green
} else {
    Write-Host "   ✓ 디렉토리 존재" -ForegroundColor Green
}

Write-Host ""
Write-Host "2. 기존 설정 파일 백업 중..." -ForegroundColor Yellow
if (Test-Path $configPath) {
    $backupPath = "$configPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $configPath $backupPath
    Write-Host "   ✓ 백업 완료: $backupPath" -ForegroundColor Green
} else {
    Write-Host "   기존 파일 없음 (새로 생성)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "3. 새 설정 파일 복사 중..." -ForegroundColor Yellow
$sourceConfig = Join-Path $PSScriptRoot "claude-desktop-config.json"

if (Test-Path $sourceConfig) {
    Copy-Item $sourceConfig $configPath -Force
    Write-Host "   ✓ 설정 파일 복사 완료" -ForegroundColor Green
} else {
    Write-Host "   ✗ 소스 파일을 찾을 수 없습니다: $sourceConfig" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "4. 설정 파일 검증 중..." -ForegroundColor Yellow
try {
    $config = Get-Content $configPath -Raw | ConvertFrom-Json
    if ($config.mcpServers.supabase) {
        Write-Host "   ✓ Supabase MCP 서버 설정 확인" -ForegroundColor Green
        Write-Host "   - URL: $($config.mcpServers.supabase.env.SUPABASE_URL)" -ForegroundColor Gray
    } else {
        Write-Host "   ✗ Supabase 설정을 찾을 수 없습니다" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ✗ JSON 파싱 오류: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✓ 설정 적용 완료!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "1. Claude Desktop을 완전히 종료하세요" -ForegroundColor White
Write-Host "2. Claude Desktop을 다시 시작하세요" -ForegroundColor White
Write-Host "3. 새 채팅에서 MCP 서버가 활성화되었는지 확인하세요" -ForegroundColor White
Write-Host ""
Write-Host "확인 방법:" -ForegroundColor Yellow
Write-Host "  - 채팅에서 '사용 가능한 MCP 도구를 보여줘' 라고 물어보세요" -ForegroundColor White
Write-Host "  - 또는 '테이블 목록을 조회해줘' 라고 요청하세요" -ForegroundColor White
Write-Host ""

# Claude Desktop 프로세스 확인
$claudeProcess = Get-Process -Name "Claude" -ErrorAction SilentlyContinue
if ($claudeProcess) {
    Write-Host "⚠ Claude Desktop이 실행 중입니다!" -ForegroundColor Red
    Write-Host "변경사항을 적용하려면 Claude Desktop을 재시작해야 합니다." -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "지금 Claude Desktop을 종료하시겠습니까? (Y/N)"
    if ($response -eq "Y" -or $response -eq "y") {
        Stop-Process -Name "Claude" -Force
        Write-Host "✓ Claude Desktop이 종료되었습니다." -ForegroundColor Green
        Write-Host "이제 다시 시작하세요." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
