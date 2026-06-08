import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HelloWorldService } from './hello-world.service';
import { HelloResponse, InfoResponse } from '../shared/models/api.models';

type Tab = 'hello' | 'greet' | 'post' | 'info';

@Component({
  selector: 'app-hello',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">

      <!-- ── Header ── -->
      <header class="header">
        <div class="header-inner">
          <div class="logo">
            <span class="logo-mark">SB</span>
            <div class="logo-text">
              <span class="logo-title">Hello World</span>
              <span class="logo-sub">Spring Boot 4.0.6 · Angular 21</span>
            </div>
          </div>
          <div class="status-pill" [class.online]="isOnline()">
            <span class="status-dot"></span>
            {{ isOnline() ? 'API Online' : 'Connecting…' }}
          </div>
        </div>
      </header>

      <!-- ── Tab Nav ── -->
      <nav class="tab-nav">
        <button class="tab" [class.active]="activeTab() === 'hello'" (click)="setTab('hello')">
          <span class="tab-method get">GET</span> /hello
        </button>
        <button class="tab" [class.active]="activeTab() === 'greet'" (click)="setTab('greet')">
          <span class="tab-method get">GET</span> /hello/&#123;name&#125;
        </button>
        <button class="tab" [class.active]="activeTab() === 'post'" (click)="setTab('post')">
          <span class="tab-method post">POST</span> /hello
        </button>
        <button class="tab" [class.active]="activeTab() === 'info'" (click)="setTab('info')">
          <span class="tab-method get">GET</span> /info
        </button>
      </nav>

      <!-- ── Main Content ── -->
      <main class="content">

        <!-- GET /hello -->
        <section *ngIf="activeTab() === 'hello'" class="panel">
          <div class="panel-header">
            <h2>GET /api/v1/hello</h2>
            <p class="panel-desc">Fetches a plain Hello World greeting from the Spring Boot service.</p>
          </div>
          <button class="btn-primary" [class.loading]="helloLoading()" (click)="callHello()">
            <span *ngIf="!helloLoading()">Send Request</span>
            <span *ngIf="helloLoading()" class="spinner"></span>
          </button>
          <div class="response-area" *ngIf="helloData() || helloError()">
            <app-response-card
              [data]="helloData()"
              [error]="helloError()">
            </app-response-card>
          </div>
        </section>

        <!-- GET /hello/{name} -->
        <section *ngIf="activeTab() === 'greet'" class="panel">
          <div class="panel-header">
            <h2>GET /api/v1/hello/&#123;name&#125;</h2>
            <p class="panel-desc">Sends your name as a path variable and gets a personalised greeting.</p>
          </div>
          <div class="input-row">
            <div class="input-group">
              <label for="nameInput">Name</label>
              <input
                id="nameInput"
                type="text"
                [(ngModel)]="nameInput"
                placeholder="e.g. Kubernetes"
                (keyup.enter)="callGreet()"
              />
            </div>
            <button class="btn-primary" [class.loading]="greetLoading()" (click)="callGreet()">
              <span *ngIf="!greetLoading()">Send</span>
              <span *ngIf="greetLoading()" class="spinner"></span>
            </button>
          </div>
          <div class="url-preview" *ngIf="nameInput">
            <code>GET /api/v1/hello/{{ nameInput }}</code>
          </div>
          <div class="response-area" *ngIf="greetData() || greetError()">
            <app-response-card [data]="greetData()" [error]="greetError()"></app-response-card>
          </div>
        </section>

        <!-- POST /hello -->
        <section *ngIf="activeTab() === 'post'" class="panel">
          <div class="panel-header">
            <h2>POST /api/v1/hello</h2>
            <p class="panel-desc">Sends a JSON body with a name and gets a greeting plus the echoed payload.</p>
          </div>
          <div class="input-row">
            <div class="input-group">
              <label for="postNameInput">Name (request body)</label>
              <input
                id="postNameInput"
                type="text"
                [(ngModel)]="postNameInput"
                placeholder="e.g. Angular"
                (keyup.enter)="callPost()"
              />
            </div>
            <button class="btn-primary" [class.loading]="postLoading()" (click)="callPost()">
              <span *ngIf="!postLoading()">Send</span>
              <span *ngIf="postLoading()" class="spinner"></span>
            </button>
          </div>
          <div class="url-preview">
            <code>POST /api/v1/hello · &#123; "name": "{{ postNameInput || '…' }}" &#125;</code>
          </div>
          <div class="response-area" *ngIf="postData() || postError()">
            <app-response-card [data]="postData()" [error]="postError()"></app-response-card>
          </div>
        </section>

        <!-- GET /info -->
        <section *ngIf="activeTab() === 'info'" class="panel">
          <div class="panel-header">
            <h2>GET /api/v1/info</h2>
            <p class="panel-desc">Returns service metadata — framework version, Java runtime, and available endpoints.</p>
          </div>
          <button class="btn-primary" [class.loading]="infoLoading()" (click)="callInfo()">
            <span *ngIf="!infoLoading()">Send Request</span>
            <span *ngIf="infoLoading()" class="spinner"></span>
          </button>

          <!-- Info-specific rich display -->
          <div class="info-card" *ngIf="infoData()">
            <div class="info-kv">
              <span class="info-key">Application</span>
              <span class="info-val">{{ infoData()!.application }}</span>
            </div>
            <div class="info-kv">
              <span class="info-key">Framework</span>
              <span class="info-val accent">{{ infoData()!.framework }}</span>
            </div>
            <div class="info-kv">
              <span class="info-key">Java Version</span>
              <span class="info-val">{{ infoData()!.javaVersion }}</span>
            </div>
            <div class="info-kv endpoints-kv">
              <span class="info-key">Endpoints</span>
              <ul class="endpoint-list">
                <li *ngFor="let ep of infoData()!.endpoints">
                  <code>{{ ep }}</code>
                </li>
              </ul>
            </div>
          </div>
          <div class="response-area" *ngIf="infoError()">
            <app-response-card [data]="null" [error]="infoError()"></app-response-card>
          </div>
        </section>

      </main>

      <!-- ── Footer ── -->
      <footer class="footer">
        Spring Boot 4.0.6 · Java 21 · Angular 21 · Kubernetes · NGINX Ingress
      </footer>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Syne:wght@400;600;800&display=swap');

    :host { display: block; }

    /* ── Tokens ── */
    .page {
      --bg:       #0b0e14;
      --surface:  #131720;
      --border:   #222840;
      --accent:   #5b8fff;
      --accent2:  #38d9a9;
      --text:     #e4e8f5;
      --muted:    #6b7499;
      --get:      #38d9a9;
      --post:     #f5a524;
      --error:    #ff5e7d;
      --radius:   12px;
      --mono:     'JetBrains Mono', monospace;
      --sans:     'Syne', sans-serif;

      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font-family: var(--sans);
      display: flex;
      flex-direction: column;
    }

    /* ── Header ── */
    .header {
      border-bottom: 1px solid var(--border);
      background: var(--surface);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .header-inner {
      max-width: 900px;
      margin: 0 auto;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo { display: flex; align-items: center; gap: 14px; }
    .logo-mark {
      width: 40px; height: 40px;
      background: var(--accent);
      border-radius: 10px;
      display: grid; place-items: center;
      font-weight: 800; font-size: 15px;
      color: #0b0e14;
      letter-spacing: -0.5px;
      flex-shrink: 0;
    }
    .logo-text { display: flex; flex-direction: column; gap: 2px; }
    .logo-title { font-size: 18px; font-weight: 800; letter-spacing: -0.3px; }
    .logo-sub { font-size: 11px; color: var(--muted); font-family: var(--mono); font-weight: 400; }

    .status-pill {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 14px;
      border-radius: 99px;
      border: 1px solid var(--border);
      font-size: 12px;
      font-family: var(--mono);
      color: var(--muted);
      transition: all 0.3s;
    }
    .status-pill.online {
      border-color: var(--accent2);
      color: var(--accent2);
    }
    .status-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--muted);
      transition: background 0.3s;
    }
    .status-pill.online .status-dot {
      background: var(--accent2);
      box-shadow: 0 0 6px var(--accent2);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    /* ── Tab Nav ── */
    .tab-nav {
      display: flex;
      gap: 4px;
      padding: 16px 24px 0;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
      flex-wrap: wrap;
    }
    .tab {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 18px;
      border-radius: var(--radius) var(--radius) 0 0;
      border: 1px solid transparent;
      background: transparent;
      color: var(--muted);
      font-family: var(--mono);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab:hover { color: var(--text); background: var(--surface); }
    .tab.active {
      background: var(--surface);
      border-color: var(--border);
      border-bottom-color: var(--surface);
      color: var(--text);
    }
    .tab-method {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
    }
    .tab-method.get  { background: rgba(56,217,169,0.15); color: var(--get); }
    .tab-method.post { background: rgba(245,165,36,0.15); color: var(--post); }

    /* ── Content ── */
    .content {
      flex: 1;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
      padding: 0 24px 40px;
    }

    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-top: none;
      border-radius: 0 var(--radius) var(--radius) var(--radius);
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .panel-header h2 {
      font-family: var(--mono);
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 8px;
      color: var(--accent);
    }
    .panel-desc { margin: 0; color: var(--muted); font-size: 14px; font-weight: 400; }

    /* ── Inputs ── */
    .input-row {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }
    .input-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .input-group label {
      font-size: 12px;
      font-family: var(--mono);
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .input-group input {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 16px;
      color: var(--text);
      font-family: var(--mono);
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    .input-group input:focus { border-color: var(--accent); }
    .input-group input::placeholder { color: var(--muted); }

    .url-preview {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 16px;
    }
    .url-preview code {
      font-family: var(--mono);
      font-size: 12px;
      color: var(--muted);
    }

    /* ── Button ── */
    .btn-primary {
      padding: 12px 28px;
      background: var(--accent);
      border: none;
      border-radius: 8px;
      color: #0b0e14;
      font-family: var(--sans);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 130px;
      min-height: 44px;
      white-space: nowrap;
    }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:active { transform: scale(0.98); }
    .btn-primary.loading { opacity: 0.7; cursor: default; }

    .spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(11,14,20,0.3);
      border-top-color: #0b0e14;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Info Card ── */
    .info-card {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      animation: fadeUp 0.3s ease;
    }
    .info-kv {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--border);
    }
    .info-kv:last-child { border-bottom: none; }
    .info-key {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.07em;
      min-width: 120px;
      padding-top: 2px;
    }
    .info-val {
      font-family: var(--mono);
      font-size: 14px;
      color: var(--text);
    }
    .info-val.accent { color: var(--accent2); }
    .endpoint-list {
      margin: 0; padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .endpoint-list code {
      font-family: var(--mono);
      font-size: 13px;
      color: var(--accent);
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Footer ── */
    .footer {
      text-align: center;
      padding: 20px;
      font-family: var(--mono);
      font-size: 11px;
      color: var(--muted);
      border-top: 1px solid var(--border);
    }
  `]
})
export class HelloComponent implements OnInit {
  private readonly svc = inject(HelloWorldService);

  activeTab = signal<Tab>('hello');
  isOnline = signal(false);

  // GET /hello
  helloData   = signal<HelloResponse | null>(null);
  helloError  = signal<string | null>(null);
  helloLoading = signal(false);

  // GET /hello/{name}
  nameInput   = '';
  greetData   = signal<HelloResponse | null>(null);
  greetError  = signal<string | null>(null);
  greetLoading = signal(false);

  // POST /hello
  postNameInput = '';
  postData    = signal<HelloResponse | null>(null);
  postError   = signal<string | null>(null);
  postLoading = signal(false);

  // GET /info
  infoData    = signal<InfoResponse | null>(null);
  infoError   = signal<string | null>(null);
  infoLoading = signal(false);

  ngOnInit() {
    // Auto-call /hello on load to verify API is reachable
    this.callHello();
  }

  setTab(tab: Tab) { this.activeTab.set(tab); }

  callHello() {
    this.helloLoading.set(true);
    this.helloData.set(null);
    this.helloError.set(null);
    this.svc.getHello().subscribe({
      next: d => { this.helloData.set(d); this.helloLoading.set(false); this.isOnline.set(true); },
      error: e => { this.helloError.set(e.message); this.helloLoading.set(false); this.isOnline.set(false); }
    });
  }

  callGreet() {
    if (!this.nameInput.trim()) return;
    this.greetLoading.set(true);
    this.greetData.set(null);
    this.greetError.set(null);
    this.svc.getHelloName(this.nameInput.trim()).subscribe({
      next: d => { this.greetData.set(d); this.greetLoading.set(false); },
      error: e => { this.greetError.set(e.message); this.greetLoading.set(false); }
    });
  }

  callPost() {
    this.postLoading.set(true);
    this.postData.set(null);
    this.postError.set(null);
    this.svc.postHello(this.postNameInput.trim() || 'Angular').subscribe({
      next: d => { this.postData.set(d); this.postLoading.set(false); },
      error: e => { this.postError.set(e.message); this.postLoading.set(false); }
    });
  }

  callInfo() {
    this.infoLoading.set(true);
    this.infoData.set(null);
    this.infoError.set(null);
    this.svc.getInfo().subscribe({
      next: d => { this.infoData.set(d); this.infoLoading.set(false); },
      error: e => { this.infoError.set(e.message); this.infoLoading.set(false); }
    });
  }
}
