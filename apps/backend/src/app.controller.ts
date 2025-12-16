// apps/backend/src/app.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import type { Response } from 'express'; // 👈 Thêm chữ "type" vào đây

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHealthCheck(@Res() res: Response) {
    // 1. Lấy dữ liệu raw từ Service
    const data = await this.appService.getHealthCheck();

    // 2. Tạo giao diện Hacker (HTML + CSS)
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SYSTEM STATUS :: CLASSIFIED</title>
        <style>
          :root {
            --bg-color: #0a0a0a;
            --text-color: #00ff41; /* Hacker Green */
            --dim-color: #008f11;
            --alert-color: #ff3333;
            --font-stack: 'Courier New', 'Consolas', monospace;
          }
          body {
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: var(--font-stack);
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            min-height: 100vh;
            text-shadow: 0 0 2px rgba(0, 255, 65, 0.5);
          }
          .terminal {
            width: 100%;
            max-width: 900px;
            border: 2px solid var(--dim-color);
            padding: 30px;
            box-shadow: 0 0 20px rgba(0, 143, 17, 0.2);
            position: relative;
            overflow: hidden;
          }
          .terminal::before {
            content: " ";
            display: block;
            position: absolute;
            top: 0; left: 0; bottom: 0; right: 0;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            z-index: 2;
            background-size: 100% 2px, 3px 100%;
            pointer-events: none;
          }
          h1, h2 { text-transform: uppercase; margin: 0; letter-spacing: 2px; }
          h1 { border-bottom: 2px solid var(--dim-color); padding-bottom: 10px; margin-bottom: 20px; font-size: 24px; }
          .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px; }
          .card { border: 1px dashed var(--dim-color); padding: 15px; }
          .card-title { color: var(--dim-color); font-size: 12px; margin-bottom: 10px; display: block; }
          .row { display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dotted #333; padding-bottom: 4px; }
          .label { font-weight: bold; }
          .value { color: #fff; }
          .status-ok { color: var(--text-color); font-weight: bold; }
          .status-err { color: var(--alert-color); font-weight: bold; blink: 1s; }
          
          /* ASCII ART */
          .ascii { white-space: pre; font-size: 10px; color: var(--dim-color); margin-bottom: 20px; line-height: 10px; text-align: center;}
          
          /* Footer & Blink */
          .footer { margin-top: 30px; font-size: 12px; color: #555; text-align: right; }
          .blink { animation: blinker 1s linear infinite; }
          @keyframes blinker { 50% { opacity: 0; } }
          
          /* Scanline animation */
          @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
        </style>
      </head>
      <body>
        <div class="terminal">
          <div class="ascii">
      ██╗   ██╗ ██████╗  ██████╗ ██████╗ ██████╗ 
      ██║   ██║██╔═══██╗██╔════╝██╔═══██╗██╔══██╗
      ██║   ██║██║   ██║██║     ███████║██████╔╝
      ╚██╗ ██╔╝██║   ██║██║     ██╔═══██║██╔══██╗
       ╚████╔╝ ╚██████╔╝╚██████╗██║   ██║██████╔╝
        ╚═══╝   ╚═════╝  ╚═════╝╚═╝   ╚═╝╚═════╝ 
          SYSTEM INITIALIZED... ACCESS GRANTED
          </div>

          <h1>🚀 SYSTEM STATUS REPORT</h1>

          <div class="grid">
            <div class="card">
              <span class="card-title">[ SYSTEM_INTEGRITY ]</span>
              <div class="row"><span class="label">STATUS:</span> <span class="value status-ok">${data.status}</span></div>
              <div class="row"><span class="label">PLATFORM:</span> <span class="value">${data.system.platform}</span></div>
              <div class="row"><span class="label">PORT:</span> <span class="value">${data.system.port}</span></div>
              <div class="row"><span class="label">PROTOCOL:</span> <span class="value">${data.system.protocol}</span></div>
              <div class="row"><span class="label">ENV:</span> <span class="value">${data.system.environment}</span></div>
            </div>

            <div class="card">
              <span class="card-title">[ NETWORK_UPLINK ]</span>
              <div class="row"><span class="label">DATABASE:</span> <span class="value">${data.connectivity.database.includes('Connected') ? '<span class="status-ok">ONLINE ✅</span>' : '<span class="status-err">OFFLINE ❌</span>'}</span></div>
              <div class="row"><span class="label">USER COUNT:</span> <span class="value">${data.connectivity.total_users}</span></div>
              <div class="row"><span class="label">CORS POLICY:</span> <span class="value">ACTIVE (Universal)</span></div>
            </div>
          </div>

          <div class="card">
            <span class="card-title">[ SECURITY_PROTOCOLS ]</span>
            <div class="row"><span class="label">DB CONNECTION STRING:</span> <span class="value">${data.configuration_checks.database_url}</span></div>
            <div class="row"><span class="label">GOOGLE OAUTH:</span> <span class="value">${data.configuration_checks.google_oauth}</span></div>
            <div class="row"><span class="label">JWT SECRET:</span> <span class="value">${data.configuration_checks.jwt_secret}</span></div>
          </div>

          <div style="margin-top: 20px; border: 1px solid var(--text-color); padding: 10px;">
            <span class="blink">█</span> ${data.message}
          </div>

          <div class="footer">
            TIMESTAMP: ${data.timestamp} | SERVER_ID: ${Math.random().toString(36).substring(7).toUpperCase()}
          </div>
        </div>
      </body>
      </html>
    `;

    // 3. Trả về HTML thay vì JSON
    res.send(html);
  }
}
