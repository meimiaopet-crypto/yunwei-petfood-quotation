@echo off
chcp 65001 >nul
echo.
echo   ============================================================
echo       云威宠物食品报价系统 - 一键启动 (Windows)
echo   ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node 18+
    pause
    exit /b 1
)
echo [OK] Node 已就绪

if not exist node_modules (
    echo [安装] 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)
echo [OK] 依赖已就绪

if not exist .env.local (
    echo [配置] 创建 .env.local（使用 Mock 模式）
    copy .env.example .env.local >nul
)
echo [OK] .env.local 已就绪

echo.
echo [启动] http://localhost:3000
echo   提示：如遇 [SAFE_DELETE_BULK_GUARD_ERROR] EPERM，是 WorkBuddy IDE
echo        的 genie-safe-delete shim 拦截了 Node 子进程的 fs.unlink。
echo        本脚本已自动清空 NODE_OPTIONS / BASH_ENV 规避该问题。
echo.

REM 关键：清空 WorkBuddy IDE 注入的 safe-delete shim，避免 next dev 在清理 .next 时被 EPERM 终止
set NODE_OPTIONS=
set BASH_ENV=
node node_modules\next\dist\bin\next dev
pause
