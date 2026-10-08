@echo off
title Shadow AI Defense Platform - Benchmark ^& E2E Test Suite
color 0B

echo =========================================================================
echo    AI-Powered Shadow AI Data Leakage Detection ^& Risk Assessment Platform
echo                     Automated Test Suite Runner
echo =========================================================================
echo.

cd /d "%~dp0"

echo [1/2] RUNNING DETECTION ENGINE 15-SCENARIO SYNTHETIC BENCHMARK...
echo -------------------------------------------------------------------------
python tests/test_detection_engine.py
if errorlevel 1 (
    color 0C
    echo [-] Python Detection Engine Benchmark failed!
    pause
    exit /b 1
)

echo.
echo [2/2] RUNNING FULL END-TO-END SYSTEM INTEGRATION TEST SUITE...
echo -------------------------------------------------------------------------
node tests/run_e2e_full_verification.js
if errorlevel 1 (
    color 0C
    echo [-] End-to-End System Integration tests failed!
    pause
    exit /b 1
)

echo.
echo =========================================================================
echo    [+] ALL BENCHMARKS AND INTEGRATION TESTS COMPLETED SUCCESSFULLY!
echo =========================================================================
echo.
pause
