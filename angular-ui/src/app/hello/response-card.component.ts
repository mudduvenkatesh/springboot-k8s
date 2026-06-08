import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelloResponse } from '../shared/models/api.models';

@Component({
  selector: 'app-response-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Error state -->
    <div class="card error-card" *ngIf="error">
      <div class="card-header">
        <span class="badge badge-error">ERROR</span>
        <span class="card-label">Response</span>
      </div>
      <p class="error-msg">{{ error }}</p>
    </div>

    <!-- Success state -->
    <div class="card success-card" *ngIf="data && !error">
      <div class="card-header">
        <span class="badge badge-ok">200 OK</span>
        <span class="card-label">application/json</span>
        <span class="card-ts">{{ data.timestamp | date:'HH:mm:ss' }}</span>
      </div>

      <!-- Highlight box: the message -->
      <div class="message-hero">
        <span class="message-text">{{ data.message }}</span>
      </div>

      <!-- Key/value grid -->
      <div class="kv-grid">
        <div class="kv-row">
          <span class="kv-key">status</span>
          <span class="kv-val status-ok">{{ data.status }}</span>
        </div>
        <div class="kv-row">
          <span class="kv-key">service</span>
          <span class="kv-val">{{ data.service }}</span>
        </div>
        <div class="kv-row">
          <span class="kv-key">version</span>
          <span class="kv-val">{{ data.version }}</span>
        </div>
        <div class="kv-row">
          <span class="kv-key">timestamp</span>
          <span class="kv-val">{{ data.timestamp }}</span>
        </div>
        <div class="kv-row" *ngIf="data.echo">
          <span class="kv-key">echo</span>
          <span class="kv-val">{{ data.echo | json }}</span>
        </div>
      </div>

      <!-- Raw JSON toggle -->
      <button class="raw-toggle" (click)="showRaw = !showRaw">
        {{ showRaw ? '▲ Hide' : '▼ Show' }} raw JSON
      </button>
      <pre class="raw-json" *ngIf="showRaw">{{ data | json }}</pre>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .card {
      border-radius: 12px;
      overflow: hidden;
      animation: fadeUp 0.25s ease;
      font-family: 'JetBrains Mono', monospace;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Error ── */
    .error-card {
      background: rgba(255,94,125,0.08);
      border: 1px solid rgba(255,94,125,0.3);
    }
    .error-msg {
      margin: 0;
      padding: 16px 20px;
      font-size: 13px;
      color: #ff5e7d;
    }

    /* ── Success ── */
    .success-card {
      background: #0d1119;
      border: 1px solid #222840;
    }

    /* ── Card header ── */
    .card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      border-bottom: 1px solid #222840;
      background: rgba(255,255,255,0.02);
    }
    .badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .badge-ok    { background: rgba(56,217,169,0.15); color: #38d9a9; }
    .badge-error { background: rgba(255,94,125,0.15); color: #ff5e7d; }
    .card-label  { font-size: 11px; color: #6b7499; }
    .card-ts     { margin-left: auto; font-size: 11px; color: #6b7499; }

    /* ── Message hero ── */
    .message-hero {
      padding: 28px 20px;
      border-bottom: 1px solid #222840;
      text-align: center;
    }
    .message-text {
      font-size: 22px;
      font-weight: 600;
      color: #5b8fff;
      letter-spacing: -0.3px;
    }

    /* ── KV grid ── */
    .kv-grid {
      display: flex;
      flex-direction: column;
    }
    .kv-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 10px 20px;
      border-bottom: 1px solid rgba(34,40,64,0.6);
    }
    .kv-row:last-child { border-bottom: none; }
    .kv-key {
      font-size: 11px;
      color: #6b7499;
      min-width: 100px;
      padding-top: 1px;
    }
    .kv-val {
      font-size: 13px;
      color: #e4e8f5;
      word-break: break-all;
    }
    .status-ok { color: #38d9a9; }

    /* ── Raw JSON ── */
    .raw-toggle {
      width: 100%;
      padding: 10px 20px;
      background: transparent;
      border: none;
      border-top: 1px solid #222840;
      color: #6b7499;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      cursor: pointer;
      text-align: left;
      transition: color 0.2s;
    }
    .raw-toggle:hover { color: #e4e8f5; }
    .raw-json {
      margin: 0;
      padding: 16px 20px;
      font-size: 12px;
      color: #38d9a9;
      background: rgba(0,0,0,0.2);
      overflow-x: auto;
      border-top: 1px solid #222840;
      line-height: 1.7;
    }
  `]
})
export class ResponseCardComponent {
  @Input() data: HelloResponse | null = null;
  @Input() error: string | null = null;
  showRaw = false;
}
