# Shadow AI Defense - Chrome / Edge Browser Extension (Manifest V3)

## Overview
This browser extension provides **real-time endpoint monitoring and Data Loss Prevention (DLP)** for corporate users interacting with external Generative AI services.

It monitors user prompt interactions on:
* **ChatGPT** (`https://chatgpt.com`, `https://*.openai.com`)
* **Google Gemini** (`https://gemini.google.com`)
* **Claude** (`https://claude.ai`, `https://*.anthropic.com`)
* **Microsoft Copilot** (`https://copilot.microsoft.com`)

---

## How to Install in Google Chrome or Microsoft Edge (30 Seconds)

1. Open **Google Chrome** or **Microsoft Edge**.
2. Navigate to your browser's extensions management page:
   * Chrome: `chrome://extensions`
   * Edge: `edge://extensions`
3. In the top-right corner, toggle **Developer mode** to **ON**.
4. Click **Load unpacked** (top-left).
5. Select the folder:
   ```
   e:\shadow-ai-defense\browser-extension
   ```
6. The extension is now loaded! You will see the **Shadow AI Defense Agent** icon in your browser toolbar.

---

## How to Test Live in Front of Project Examiners

1. Ensure the platform backend is running:
   ```powershell
   e:\shadow-ai-defense\start_soc.bat
   ```
2. Open a browser tab to `https://chatgpt.com` or `https://gemini.google.com`.
3. Notice the floating **"🟢 DLP Shield Active"** badge at the bottom-right corner.
4. Type or paste a sensitive prompt:
   ```
   Deploying AWS lambda with key AKIAIOSFODNN7EXAMPLE and database postgresql://admin:Pass123@10.0.1.5:5432/db
   ```
5. Press **Enter** or click send.
6. The extension:
   * Transmits the `AIServiceEvent` to `http://localhost:5000/api/v1/events/ingest`.
   * Pops up the red **SHADOW AI DEFENSE ALERT [CRITICAL]** banner warning the user.
   * Telemetry immediately lights up the live SOC Portal at `http://localhost:5000` with an escalated incident and risk score!
