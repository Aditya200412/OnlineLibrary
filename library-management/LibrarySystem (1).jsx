import { useState, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN: "Mission Control" — deep space dark UI, electric cyan + violet accents,
// glassmorphism panels, animated counters, glowing borders, floating orbs.
//
// BACKEND: All data is fetched from Spring Boot at http://localhost:8080
//          Change BASE_URL below if your backend runs on a different port/host.
// ═══════════════════════════════════════════════════════════════════════════════

const BASE_URL = "http://localhost:8080/api";

// ─── API Layer ────────────────────────────────────────────────────────────────
// Every function calls the Spring Boot REST API and unwraps the ApiResponse<T>
// envelope: { success, message, data, timestamp }

const api = {
  // ── Books ──────────────────────────────────────────────────────────────────
  getBooks: (page = 0, size = 100) =>
    fetch(`${BASE_URL}/books?page=${page}&size=${size}`)
      .then(r => r.json()).then(d => d.data?.content ?? []),

  searchBooks: (keyword, page = 0, size = 50) =>
    fetch(`${BASE_URL}/books/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`)
      .then(r => r.json()).then(d => d.data?.content ?? []),

  createBook: (body) =>
    fetch(`${BASE_URL}/books`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(r => r.json()),

  updateBook: (id, body) =>
    fetch(`${BASE_URL}/books/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(r => r.json()),

  deleteBook: (id) =>
    fetch(`${BASE_URL}/books/${id}`, { method: "DELETE" }).then(r => r.json()),

  getAvailableBooks: () =>
    fetch(`${BASE_URL}/books/available`).then(r => r.json()).then(d => d.data ?? []),

  // ── Users ───────────────────────────────────────────────────────────────────
  getUsers: (page = 0, size = 100) =>
    fetch(`${BASE_URL}/users?page=${page}&size=${size}`)
      .then(r => r.json()).then(d => d.data?.content ?? []),

  createUser: (body) =>
    fetch(`${BASE_URL}/users`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(r => r.json()),

  deactivateUser: (id) =>
    fetch(`${BASE_URL}/users/${id}`, { method: "DELETE" }).then(r => r.json()),

  // ── Transactions ─────────────────────────────────────────────────────────
  getTransactions: (page = 0, size = 100) =>
    fetch(`${BASE_URL}/transactions?page=${page}&size=${size}`)
      .then(r => r.json()).then(d => d.data?.content ?? []),

  getTransactionsByUser: (userId, page = 0, size = 50) =>
    fetch(`${BASE_URL}/transactions/user/${userId}?page=${page}&size=${size}`)
      .then(r => r.json()).then(d => d.data?.content ?? []),

  getOverdueTransactions: () =>
    fetch(`${BASE_URL}/transactions/overdue`).then(r => r.json()).then(d => d.data ?? []),

  borrowBook: (body) =>
    fetch(`${BASE_URL}/transactions/borrow`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(r => r.json()),

  returnBook: (body) =>
    fetch(`${BASE_URL}/transactions/return`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(r => r.json()),
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --void:#03060F;--deep:#060D1A;--surface:#0A1628;--panel:#0E1C35;
    --glass:rgba(14,28,53,0.7);--border:rgba(56,139,253,0.15);--border-hi:rgba(56,139,253,0.4);
    --cyan:#00D4FF;--cyan-dim:rgba(0,212,255,0.12);--cyan-glow:rgba(0,212,255,0.25);
    --violet:#9B5DFF;--violet-dim:rgba(155,93,255,0.12);
    --amber:#FFB830;--amber-dim:rgba(255,184,48,0.12);
    --rose:#FF4D6D;--rose-dim:rgba(255,77,109,0.12);
    --green:#00E5A0;--green-dim:rgba(0,229,160,0.12);
    --text-1:#E8F0FF;--text-2:#8899BB;--text-3:#4A5A7A;
    --font-display:'Syne',sans-serif;--font-body:'Outfit',sans-serif;--font-mono:'JetBrains Mono',monospace;
    --r-sm:6px;--r:10px;--r-lg:16px;--r-xl:22px;
  }
  html{scroll-behavior:smooth;}
  body{background:var(--void);color:var(--text-1);font-family:var(--font-body);font-size:14px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
  ::-webkit-scrollbar{width:5px;height:5px;}
  ::-webkit-scrollbar-track{background:var(--deep);}
  ::-webkit-scrollbar-thumb{background:rgba(56,139,253,0.3);border-radius:9px;}

  .bg-orbs{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;}
  .orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:0.07;animation:orbFloat 20s ease-in-out infinite;}
  .orb-1{width:500px;height:500px;background:var(--cyan);top:-100px;left:-100px;}
  .orb-2{width:400px;height:400px;background:var(--violet);bottom:-80px;right:-80px;animation-delay:-8s;}
  .orb-3{width:300px;height:300px;background:var(--amber);top:40%;left:50%;animation-delay:-14s;}
  @keyframes orbFloat{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(40px,-30px) scale(1.05);}66%{transform:translate(-30px,20px) scale(0.95);}}

  .app{display:flex;min-height:100vh;position:relative;z-index:1;}

  /* Sidebar */
  .sidebar{width:260px;min-height:100vh;background:linear-gradient(180deg,rgba(6,13,26,0.98),rgba(3,6,15,0.98));border-right:1px solid var(--border);position:fixed;top:0;left:0;bottom:0;z-index:100;display:flex;flex-direction:column;backdrop-filter:blur(20px);}
  .sidebar-brand{padding:28px 24px 20px;border-bottom:1px solid var(--border);}
  .brand-logo{display:flex;align-items:center;gap:12px;margin-bottom:8px;}
  .brand-icon{width:42px;height:42px;background:linear-gradient(135deg,var(--cyan),var(--violet));border-radius:var(--r);display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 20px var(--cyan-glow);flex-shrink:0;animation:iconPulse 4s ease-in-out infinite;}
  @keyframes iconPulse{0%,100%{box-shadow:0 0 20px var(--cyan-glow);}50%{box-shadow:0 0 35px rgba(0,212,255,0.45);}}
  .brand-text h1{font-family:var(--font-display);font-size:20px;font-weight:800;background:linear-gradient(90deg,var(--cyan),var(--violet));-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
  .brand-text p{font-family:var(--font-mono);font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.14em;}
  .sidebar-status{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--green);font-family:var(--font-mono);}
  .status-dot{width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 6px var(--green);animation:blink 2s ease infinite;}
  @keyframes blink{0%,100%{opacity:1;}50%{opacity:0.3;}}
  .sidebar-nav{flex:1;padding:14px 0;overflow-y:auto;}
  .nav-group-label{font-family:var(--font-mono);font-size:9.5px;font-weight:500;text-transform:uppercase;letter-spacing:0.18em;color:var(--text-3);padding:14px 24px 5px;}
  .nav-item{display:flex;align-items:center;gap:11px;padding:10px 24px;cursor:pointer;color:var(--text-2);font-size:13.5px;font-weight:500;transition:all 0.2s;border-left:2px solid transparent;user-select:none;}
  .nav-item:hover{color:var(--text-1);background:rgba(0,212,255,0.04);}
  .nav-item.active{color:var(--cyan);border-left-color:var(--cyan);background:linear-gradient(90deg,rgba(0,212,255,0.08),transparent);}
  .nav-item.active .nav-icon{filter:drop-shadow(0 0 6px var(--cyan));}
  .nav-icon{font-size:17px;width:22px;text-align:center;flex-shrink:0;transition:filter 0.2s;}
  .nav-badge{margin-left:auto;background:var(--rose);color:white;font-size:10px;font-family:var(--font-mono);padding:1px 6px;border-radius:99px;box-shadow:0 0 8px rgba(255,77,109,0.5);}
  .sidebar-mini{padding:10px 16px;margin:0 12px 10px;background:rgba(0,212,255,0.04);border:1px solid rgba(0,212,255,0.1);border-radius:var(--r-lg);}
  .mini-label{font-family:var(--font-mono);font-size:9.5px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.14em;margin-bottom:9px;}
  .mini-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;}
  .sidebar-footer{padding:14px 24px;border-top:1px solid var(--border);font-family:var(--font-mono);font-size:10px;color:var(--text-3);display:flex;justify-content:space-between;align-items:center;}
  .version-tag{background:var(--cyan-dim);color:var(--cyan);padding:2px 8px;border-radius:99px;font-size:9.5px;border:1px solid rgba(0,212,255,0.2);}

  /* Main */
  .main{margin-left:260px;flex:1;display:flex;flex-direction:column;min-height:100vh;}
  .topbar{height:64px;background:rgba(6,13,26,0.85);border-bottom:1px solid var(--border);backdrop-filter:blur(20px);padding:0 32px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;}
  .topbar-left{display:flex;align-items:center;gap:16px;}
  .breadcrumb{font-family:var(--font-mono);font-size:11px;color:var(--text-3);}
  .breadcrumb span{color:var(--text-2);}
  .page-title{font-family:var(--font-display);font-size:19px;font-weight:700;color:var(--text-1);}
  .topbar-right{display:flex;align-items:center;gap:10px;}
  .search-wrap{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--r);padding:8px 14px;width:230px;transition:all 0.2s;}
  .search-wrap:focus-within{border-color:var(--cyan);background:rgba(0,212,255,0.05);box-shadow:0 0 0 3px rgba(0,212,255,0.08);}
  .search-wrap input{background:none;border:none;outline:none;font-family:var(--font-body);font-size:13px;color:var(--text-1);width:100%;}
  .search-wrap input::placeholder{color:var(--text-3);}
  .icon-btn{width:36px;height:36px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;transition:all 0.2s;position:relative;}
  .icon-btn:hover{border-color:var(--border-hi);background:rgba(0,212,255,0.07);}
  .notif-dot{position:absolute;top:5px;right:5px;width:7px;height:7px;background:var(--rose);border-radius:50%;box-shadow:0 0 5px var(--rose);}
  .avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--cyan),var(--violet));display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 0 12px rgba(0,212,255,0.3);color:var(--void);flex-shrink:0;}
  .content{padding:28px 32px;flex:1;}

  /* Animations */
  .page-enter{animation:pageEnter 0.35s cubic-bezier(0.16,1,0.3,1) forwards;}
  @keyframes pageEnter{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}

  /* Stats */
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;}
  .stat-card{background:var(--glass);border:1px solid var(--border);border-radius:var(--r-xl);padding:22px 24px;position:relative;overflow:hidden;backdrop-filter:blur(12px);transition:transform 0.25s,box-shadow 0.25s,border-color 0.25s;animation:cardReveal 0.5s cubic-bezier(0.16,1,0.3,1) both;}
  .stat-card:nth-child(1){animation-delay:0.05s;}.stat-card:nth-child(2){animation-delay:0.10s;}.stat-card:nth-child(3){animation-delay:0.15s;}.stat-card:nth-child(4){animation-delay:0.20s;}
  @keyframes cardReveal{from{opacity:0;transform:translateY(20px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);}}
  .stat-card:hover{transform:translateY(-3px);}
  .stat-card.c-cyan{border-color:rgba(0,212,255,0.2);}.stat-card.c-cyan:hover{border-color:rgba(0,212,255,0.45);box-shadow:0 12px 40px rgba(0,212,255,0.1);}
  .stat-card.c-violet{border-color:rgba(155,93,255,0.2);}.stat-card.c-violet:hover{border-color:rgba(155,93,255,0.45);box-shadow:0 12px 40px rgba(155,93,255,0.1);}
  .stat-card.c-amber{border-color:rgba(255,184,48,0.2);}.stat-card.c-amber:hover{border-color:rgba(255,184,48,0.45);box-shadow:0 12px 40px rgba(255,184,48,0.1);}
  .stat-card.c-rose{border-color:rgba(255,77,109,0.2);}.stat-card.c-rose:hover{border-color:rgba(255,77,109,0.45);box-shadow:0 12px 40px rgba(255,77,109,0.1);}
  .stat-bg-icon{position:absolute;right:16px;top:10px;font-size:58px;opacity:0.055;transform:rotate(-8deg);pointer-events:none;}
  .stat-accent{width:32px;height:3px;border-radius:99px;margin-bottom:14px;}
  .c-cyan .stat-accent{background:var(--cyan);box-shadow:0 0 10px var(--cyan);}
  .c-violet .stat-accent{background:var(--violet);box-shadow:0 0 10px var(--violet);}
  .c-amber .stat-accent{background:var(--amber);box-shadow:0 0 10px var(--amber);}
  .c-rose .stat-accent{background:var(--rose);box-shadow:0 0 10px var(--rose);}
  .stat-label{font-family:var(--font-mono);font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:0.14em;color:var(--text-3);margin-bottom:5px;}
  .stat-value{font-family:var(--font-display);font-size:44px;font-weight:800;line-height:1;margin-bottom:5px;}
  .c-cyan .stat-value{color:var(--cyan);}.c-violet .stat-value{color:var(--violet);}.c-amber .stat-value{color:var(--amber);}.c-rose .stat-value{color:var(--rose);}
  .stat-sub{font-size:12px;color:var(--text-2);}
  .prog-bar{height:3px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden;margin-top:10px;}
  .prog-fill{height:100%;border-radius:99px;transition:width 1.2s cubic-bezier(0.16,1,0.3,1);}

  /* Panel */
  .panel{background:var(--glass);border:1px solid var(--border);border-radius:var(--r-xl);backdrop-filter:blur(12px);overflow:hidden;}
  .panel-head{padding:16px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
  .panel-title{font-family:var(--font-display);font-size:15px;font-weight:700;color:var(--text-1);display:flex;align-items:center;gap:9px;}
  .panel-count{font-family:var(--font-mono);font-size:11px;color:var(--text-3);background:rgba(255,255,255,0.05);padding:2px 8px;border-radius:99px;border:1px solid var(--border);}

  /* Table */
  .table-scroll{overflow-x:auto;}
  table{width:100%;border-collapse:collapse;font-size:13.5px;}
  thead th{padding:10px 20px;text-align:left;font-family:var(--font-mono);font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:0.12em;color:var(--text-3);background:rgba(0,0,0,0.2);border-bottom:1px solid var(--border);white-space:nowrap;}
  tbody tr{border-bottom:1px solid rgba(255,255,255,0.04);transition:background 0.15s;}
  tbody tr:last-child{border-bottom:none;}
  tbody tr:hover{background:rgba(0,212,255,0.04);}
  td{padding:12px 20px;color:var(--text-2);vertical-align:middle;}
  td.mono{font-family:var(--font-mono);font-size:11.5px;color:var(--text-3);}
  td strong{color:var(--text-1);font-weight:500;}

  /* Badge */
  .badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:99px;font-size:10.5px;font-family:var(--font-mono);font-weight:500;letter-spacing:0.06em;text-transform:uppercase;white-space:nowrap;}
  .badge::before{content:'';width:5px;height:5px;border-radius:50%;background:currentColor;}
  .b-cyan{color:var(--cyan);background:var(--cyan-dim);border:1px solid rgba(0,212,255,0.2);}
  .b-violet{color:var(--violet);background:var(--violet-dim);border:1px solid rgba(155,93,255,0.2);}
  .b-amber{color:var(--amber);background:var(--amber-dim);border:1px solid rgba(255,184,48,0.2);}
  .b-rose{color:var(--rose);background:var(--rose-dim);border:1px solid rgba(255,77,109,0.2);}
  .b-green{color:var(--green);background:var(--green-dim);border:1px solid rgba(0,229,160,0.2);}
  .b-dim{color:var(--text-2);background:rgba(255,255,255,0.05);border:1px solid var(--border);}

  /* Buttons */
  .btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:var(--r);font-family:var(--font-body);font-size:13.5px;font-weight:600;cursor:pointer;border:none;outline:none;transition:all 0.2s;white-space:nowrap;user-select:none;}
  .btn-primary{background:linear-gradient(135deg,var(--cyan),#0099CC);color:var(--void);box-shadow:0 4px 16px rgba(0,212,255,0.3);}
  .btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(0,212,255,0.45);}
  .btn-ghost{background:rgba(0,212,255,0.08);color:var(--cyan);border:1px solid rgba(0,212,255,0.25);}
  .btn-ghost:hover{background:rgba(0,212,255,0.14);border-color:rgba(0,212,255,0.5);}
  .btn-danger{background:rgba(255,77,109,0.1);color:var(--rose);border:1px solid rgba(255,77,109,0.25);}
  .btn-danger:hover{background:rgba(255,77,109,0.18);}
  .btn-subtle{background:rgba(255,255,255,0.05);color:var(--text-2);border:1px solid var(--border);}
  .btn-subtle:hover{background:rgba(255,255,255,0.08);color:var(--text-1);}
  .btn-sm{padding:5px 12px;font-size:12px;}
  .btn:disabled{opacity:0.4;cursor:not-allowed;transform:none !important;}

  /* Sec header */
  .sec-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;}
  .sec-title{font-family:var(--font-display);font-size:21px;font-weight:700;color:var(--text-1);}
  .sec-sub{font-family:var(--font-mono);font-size:11px;color:var(--text-3);margin-left:10px;}

  /* Tabs */
  .tab-row{display:flex;gap:4px;background:rgba(0,0,0,0.3);border-radius:var(--r-lg);padding:4px;margin-bottom:20px;border:1px solid var(--border);width:fit-content;}
  .tab{padding:7px 18px;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;color:var(--text-2);transition:all 0.2s;display:flex;align-items:center;gap:7px;user-select:none;}
  .tab:hover{color:var(--text-1);background:rgba(255,255,255,0.04);}
  .tab.active{background:var(--glass);color:var(--cyan);border:1px solid rgba(0,212,255,0.25);box-shadow:0 2px 12px rgba(0,212,255,0.12);}
  .tab-n{font-family:var(--font-mono);font-size:10px;background:rgba(255,255,255,0.06);padding:1px 6px;border-radius:99px;color:var(--text-3);}
  .tab.active .tab-n{color:var(--cyan);background:rgba(0,212,255,0.12);}

  /* Modal */
  .overlay{position:fixed;inset:0;background:rgba(3,6,15,0.8);backdrop-filter:blur(8px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s ease;}
  @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
  @keyframes modalIn{from{opacity:0;transform:translateY(20px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);}}
  .modal{background:var(--panel);border:1px solid var(--border-hi);border-radius:var(--r-xl);width:100%;max-width:540px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.6);animation:modalIn 0.25s cubic-bezier(0.16,1,0.3,1);}
  .modal-head{padding:26px 28px 18px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;position:relative;}
  .modal-head::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--cyan),var(--violet));}
  .modal-title{font-family:var(--font-display);font-size:21px;font-weight:700;color:var(--text-1);}
  .modal-sub{font-size:13px;color:var(--text-2);margin-top:3px;}
  .modal-close{background:rgba(255,255,255,0.06);border:1px solid var(--border);color:var(--text-2);font-size:18px;cursor:pointer;width:32px;height:32px;border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;transition:all 0.15s;line-height:1;flex-shrink:0;}
  .modal-close:hover{background:rgba(255,77,109,0.15);border-color:rgba(255,77,109,0.4);color:var(--rose);}
  .modal-body{padding:24px 28px;}
  .modal-foot{padding:16px 28px 24px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid var(--border);}

  /* Forms */
  .form-grid{display:grid;gap:16px;}.form-grid-2{grid-template-columns:1fr 1fr;}
  .form-group{display:flex;flex-direction:column;gap:6px;}.form-group.span-2{grid-column:span 2;}
  label{font-family:var(--font-mono);font-size:10.5px;font-weight:500;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-3);}
  input,select,textarea{padding:10px 14px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--r);font-family:var(--font-body);font-size:13.5px;color:var(--text-1);outline:none;width:100%;transition:all 0.2s;}
  input::placeholder,textarea::placeholder{color:var(--text-3);}
  input:focus,select:focus,textarea:focus{border-color:var(--cyan);background:rgba(0,212,255,0.05);box-shadow:0 0 0 3px rgba(0,212,255,0.1);}
  select{cursor:pointer;}select option{background:var(--panel);color:var(--text-1);}
  textarea{resize:vertical;min-height:80px;line-height:1.5;}

  /* Toast */
  .toast-stack{position:fixed;bottom:24px;right:24px;z-index:999;display:flex;flex-direction:column;gap:10px;pointer-events:none;}
  .toast{display:flex;align-items:flex-start;gap:10px;background:var(--panel);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 18px;min-width:300px;max-width:420px;box-shadow:0 8px 32px rgba(0,0,0,0.5);pointer-events:all;animation:toastIn 0.35s cubic-bezier(0.16,1,0.3,1);}
  @keyframes toastIn{from{opacity:0;transform:translateX(20px) scale(0.95);}to{opacity:1;transform:translateX(0) scale(1);}}
  .toast.exit{animation:toastOut 0.3s ease forwards;}
  @keyframes toastOut{to{opacity:0;transform:translateX(20px);}}
  .toast.t-success{border-left:3px solid var(--green);}.toast.t-error{border-left:3px solid var(--rose);}
  .toast-icon{font-size:17px;flex-shrink:0;margin-top:1px;}
  .toast-title{font-weight:600;font-size:13px;color:var(--text-1);margin-bottom:2px;}
  .toast-msg{font-size:12px;color:var(--text-2);}

  /* Loader */
  .loader-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:64px 20px;gap:14px;color:var(--text-3);}
  .spinner{width:32px;height:32px;border:2px solid rgba(0,212,255,0.15);border-top-color:var(--cyan);border-radius:50%;animation:spin 0.7s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .loader-text{font-family:var(--font-mono);font-size:12px;color:var(--text-3);}

  /* API error banner */
  .api-error{background:rgba(255,77,109,0.08);border:1px solid rgba(255,77,109,0.25);border-radius:var(--r-lg);padding:16px 20px;margin-bottom:20px;display:flex;align-items:flex-start;gap:12px;font-size:13px;color:var(--rose);}
  .api-error-icon{font-size:18px;flex-shrink:0;}
  .api-error-title{font-weight:600;margin-bottom:3px;}
  .api-error-msg{font-family:var(--font-mono);font-size:11.5px;opacity:0.8;}

  /* Empty */
  .empty{text-align:center;padding:60px 20px;color:var(--text-3);}
  .empty-icon{font-size:52px;opacity:0.2;margin-bottom:12px;}
  .empty h3{font-family:var(--font-display);font-size:20px;color:var(--text-2);margin-bottom:6px;}
  .empty p{font-size:13px;}

  /* Misc */
  .row{display:flex;align-items:center;gap:10px;}
  .row-between{display:flex;align-items:center;justify-content:space-between;gap:10px;}
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
  .truncate{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .mb-20{margin-bottom:20px;}.mb-28{margin-bottom:28px;}
  .text-dim{color:var(--text-3);font-size:12px;}
  @media(max-width:1100px){.stats-grid{grid-template-columns:repeat(2,1fr);}}
  @media(max-width:900px){.form-grid-2{grid-template-columns:1fr;}.form-group.span-2{grid-column:span 1;}}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split("T")[0];
const addDays = (d, n) => { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt.toISOString().split("T")[0]; };
const diffDays = (a, b) => Math.max(0, Math.round((new Date(a) - new Date(b)) / 86400000));

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimNum({ to }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (to === 0) { setV(0); return; }
    let cur = 0;
    const step = to / (800 / 16);
    const t = setInterval(() => { cur += step; if (cur >= to) { setV(to); clearInterval(t); } else setV(Math.floor(cur)); }, 16);
    return () => clearInterval(t);
  }, [to]);
  return <>{v}</>;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, type, msg, exiting: false }]);
    setTimeout(() => {
      setToasts(p => p.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 320);
    }, 4200);
  }, []);
  const dismiss = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, toast, dismiss };
}

function Toasts({ toasts, dismiss }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast t-${t.type} ${t.exiting ? "exit" : ""}`} onClick={() => dismiss(t.id)}>
          <div className="toast-icon">{t.type === "success" ? "✓" : "✗"}</div>
          <div><div className="toast-title">{t.type === "success" ? "Done!" : "Error"}</div><div className="toast-msg">{t.msg}</div></div>
        </div>
      ))}
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Loader({ text = "Loading…" }) {
  return (
    <div className="loader-wrap">
      <div className="spinner" />
      <div className="loader-text">{text}</div>
    </div>
  );
}

function ApiError({ error, onRetry }) {
  return (
    <div className="api-error">
      <div className="api-error-icon">⚠</div>
      <div>
        <div className="api-error-title">Failed to connect to backend</div>
        <div className="api-error-msg">{error}</div>
        {onRetry && <button className="btn btn-danger btn-sm" style={{ marginTop: 10 }} onClick={onRetry}>Retry</button>}
      </div>
    </div>
  );
}

function Badge({ s }) {
  const map = { ACTIVE: "b-cyan", RETURNED: "b-green", OVERDUE: "b-rose", AVAILABLE: "b-green", BORROWED: "b-amber", LIBRARIAN: "b-violet", MEMBER: "b-cyan", Active: "b-green", Inactive: "b-dim" };
  const lbl = { ACTIVE: "Active", RETURNED: "Returned", OVERDUE: "Overdue", AVAILABLE: "Available", BORROWED: "Borrowed", LIBRARIAN: "Librarian", MEMBER: "Member", Active: "Active", Inactive: "Inactive" };
  return <span className={`badge ${map[s] || "b-dim"}`}>{lbl[s] || s}</span>;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ books, users, transactions, overdueList }) {
  const totalCopies = books.reduce((s, b) => s + (b.totalCopies || 0), 0);
  const available = books.reduce((s, b) => s + (b.availableCopies || 0), 0);
  const activeLoans = transactions.filter(t => t.status === "ACTIVE" || t.status === "OVERDUE").length;
  const overdue = overdueList.length;
  const utilPct = totalCopies > 0 ? Math.round(((totalCopies - available) / totalCopies) * 100) : 0;
  const recent = [...transactions].sort((a, b) => b.id - a.id).slice(0, 6);
  const catCounts = books.reduce((a, b) => { a[b.category] = (a[b.category] || 0) + 1; return a; }, {});

  return (
    <div className="page-enter">
      <div className="stats-grid">
        {[
          { color: "c-cyan", icon: "📚", label: "Total Copies", val: totalCopies, sub: `${books.length} unique titles`, pct: 100 },
          { color: "c-violet", icon: "✅", label: "Available Now", val: available, sub: `${utilPct}% utilization`, pct: available / Math.max(totalCopies, 1) * 100 },
          { color: "c-amber", icon: "↔", label: "Active Loans", val: activeLoans, sub: `${users.filter(u => u.active && u.role === "MEMBER").length} active members`, pct: activeLoans / Math.max(totalCopies, 1) * 100 },
          { color: "c-rose", icon: "⚠", label: "Overdue", val: overdue, sub: overdue > 0 ? "Requires attention" : "All clear ✓", pct: overdue / Math.max(activeLoans, 1) * 100 },
        ].map(({ color, icon, label, val, sub, pct }) => (
          <div key={label} className={`stat-card ${color}`}>
            <div className="stat-bg-icon">{icon}</div>
            <div className="stat-accent" />
            <div className="stat-label">{label}</div>
            <div className="stat-value"><AnimNum to={val} /></div>
            <div className="stat-sub">{sub}</div>
            <div className="prog-bar">
              <div className="prog-fill" style={{ width: `${Math.min(pct, 100)}%`, background: color === "c-cyan" ? "var(--cyan)" : color === "c-violet" ? "var(--violet)" : color === "c-amber" ? "var(--amber)" : "var(--rose)" }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-28">
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Recent Transactions <span className="panel-count">{recent.length}</span></div>
          </div>
          {recent.length === 0
            ? <div className="empty"><div className="empty-icon">📋</div><h3>No activity yet</h3></div>
            : <table>
              <thead><tr><th>Member</th><th>Book</th><th>Due</th><th>Status</th></tr></thead>
              <tbody>
                {recent.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.memberName?.split(" ")[0]}</strong></td>
                    <td><span className="truncate" style={{ display: "block", maxWidth: 130 }}>{t.bookTitle}</span></td>
                    <td className="mono">{t.dueDate}</td>
                    <td><Badge s={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="panel">
            <div className="panel-head">
              <div className="panel-title" style={{ color: "var(--rose)" }}>⚠ Overdue <span className="panel-count">{overdueList.length}</span></div>
            </div>
            {overdueList.length === 0
              ? <div style={{ padding: "18px 20px", textAlign: "center", color: "var(--green)", fontFamily: "var(--font-mono)", fontSize: 13 }}>✓ No overdue items</div>
              : <table>
                <thead><tr><th>Member</th><th>Book</th><th>Days Late</th></tr></thead>
                <tbody>
                  {overdueList.map(t => (
                    <tr key={t.id}>
                      <td><strong>{t.memberName?.split(" ")[0]}</strong></td>
                      <td className="truncate" style={{ maxWidth: 110 }}>{t.bookTitle}</td>
                      <td><span className="badge b-rose">{diffDays(today(), t.dueDate)}d</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          </div>
          <div className="panel">
            <div className="panel-head"><div className="panel-title">Categories</div></div>
            <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(catCounts).map(([cat, count]) => (
                <div key={cat}>
                  <div className="row-between" style={{ marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: "var(--text-2)" }}>{cat}</span>
                    <span className="text-dim">{count}</span>
                  </div>
                  <div className="prog-bar">
                    <div className="prog-fill" style={{ width: `${count / books.length * 100}%`, background: "linear-gradient(90deg,var(--cyan),var(--violet))" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Books Page ───────────────────────────────────────────────────────────────

function BooksPage({ toast }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [catFilter, setCatFilter] = useState("ALL");
  const [form, setForm] = useState({ title: "", author: "", isbn: "", category: "", publishedYear: "", initialCopies: 1 });

  const loadBooks = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await api.getBooks();
      setBooks(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  // Debounced search
  useEffect(() => {
    if (!search.trim()) { loadBooks(); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try { setBooks(await api.searchBooks(search)); }
      catch (e) { toast(e.message, "error"); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const cats = ["ALL", ...new Set(books.map(b => b.category).filter(Boolean))];
  const filtered = catFilter === "ALL" ? books : books.filter(b => b.category === catFilter);

  const save = async () => {
    if (!form.title.trim() || !form.author.trim() || !form.isbn.trim()) { toast("Title, Author and ISBN are required.", "error"); return; }
    setSaving(true);
    try {
      const payload = modal === "create"
        ? { ...form, initialCopies: Number(form.initialCopies) }
        : { title: form.title, author: form.author, isbn: form.isbn, category: form.category, publishedYear: form.publishedYear, initialCopies: 1 };
      const res = modal === "create" ? await api.createBook(payload) : await api.updateBook(modal.id, payload);
      if (res.success) {
        toast(modal === "create" ? `"${form.title}" added to the catalogue.` : `"${form.title}" updated.`);
        setModal(null);
        loadBooks();
      } else { toast(res.message || "Operation failed.", "error"); }
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const del = async (b) => {
    if (!window.confirm(`Remove "${b.title}" from the catalogue?`)) return;
    try {
      const res = await api.deleteBook(b.id);
      if (res.success) { toast(`"${b.title}" removed.`); loadBooks(); }
      else toast(res.message || "Delete failed.", "error");
    } catch (e) { toast(e.message, "error"); }
  };

  return (
    <div className="page-enter">
      <div className="sec-hd mb-20">
        <div><span className="sec-title">Book Catalogue</span><span className="sec-sub">{filtered.length} of {books.length} titles</span></div>
        <button className="btn btn-primary" onClick={() => { setForm({ title: "", author: "", isbn: "", category: "", publishedYear: "", initialCopies: 1 }); setModal("create"); }}>＋ Add Book</button>
      </div>

      {error && <ApiError error={error} onRetry={loadBooks} />}

      <div className="row mb-20" style={{ flexWrap: "wrap", gap: 12 }}>
        <div className="search-wrap" style={{ width: 280 }}>
          <span style={{ color: "var(--text-3)" }}>{searching ? "⟳" : "⌕"}</span>
          <input placeholder="Title, author or ISBN…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="tab-row" style={{ marginBottom: 0 }}>
          {cats.map(c => (
            <div key={c} className={`tab ${catFilter === c ? "active" : ""}`} onClick={() => setCatFilter(c)}>
              {c === "ALL" ? "All" : c}<span className="tab-n">{c === "ALL" ? books.length : books.filter(b => b.category === c).length}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="table-scroll">
          {loading ? <Loader text="Loading books from API…" /> :
            filtered.length === 0
              ? <div className="empty"><div className="empty-icon">📚</div><h3>No books found</h3><p>{search ? "Try a different search." : "Add your first book."}</p></div>
              : <table>
                <thead><tr><th>Title</th><th>Author</th><th>ISBN</th><th>Category</th><th>Year</th><th>Total</th><th>Available</th><th></th></tr></thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.id}>
                      <td><strong>{b.title}</strong></td>
                      <td>{b.author}</td>
                      <td className="mono">{b.isbn}</td>
                      <td>{b.category ? <span className="badge b-dim">{b.category}</span> : <span className="text-dim">—</span>}</td>
                      <td className="mono">{b.publishedYear}</td>
                      <td className="mono" style={{ textAlign: "center" }}>{b.totalCopies}</td>
                      <td>{b.availableCopies > 0 ? <span className="badge b-green">{b.availableCopies} avail.</span> : <span className="badge b-rose">None</span>}</td>
                      <td>
                        <div className="row" style={{ gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setForm({ title: b.title, author: b.author, isbn: b.isbn, category: b.category || "", publishedYear: b.publishedYear, initialCopies: 1 }); setModal(b); }}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => del(b)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </div>

      {modal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-head">
              <div><div className="modal-title">{modal === "create" ? "Add New Book" : "Edit Book"}</div><div className="modal-sub">{modal === "create" ? "Register a book and its physical copies" : "Update book metadata"}</div></div>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="form-group span-2"><label>Title *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Clean Code" /></div>
                <div className="form-group"><label>Author *</label><input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="e.g. Robert C. Martin" /></div>
                <div className="form-group"><label>ISBN *</label><input value={form.isbn} onChange={e => setForm(f => ({ ...f, isbn: e.target.value }))} placeholder="978-XXXXXXXXXX" /></div>
                <div className="form-group"><label>Category</label><input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Programming" /></div>
                <div className="form-group"><label>Year</label><input value={form.publishedYear} onChange={e => setForm(f => ({ ...f, publishedYear: e.target.value }))} placeholder="e.g. 2008" maxLength={4} /></div>
                {modal === "create" && <div className="form-group"><label>Initial Copies</label><input type="number" min="1" max="100" value={form.initialCopies} onChange={e => setForm(f => ({ ...f, initialCopies: e.target.value }))} /></div>}
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-subtle" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : modal === "create" ? "Add Book" : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Users Page ───────────────────────────────────────────────────────────────

function UsersPage({ toast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("ALL");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "MEMBER" });

  const loadUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try { setUsers(await api.getUsers()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users.filter(u => tab === "ALL" || u.role === tab);

  const save = async () => {
    if (!form.fullName.trim() || !form.email.trim()) { toast("Name and email are required.", "error"); return; }
    setSaving(true);
    try {
      const res = await api.createUser(form);
      if (res.success) { toast(`${form.role === "LIBRARIAN" ? "Librarian" : "Member"} "${form.fullName}" registered.`); setModal(false); loadUsers(); }
      else toast(res.message || "Registration failed.", "error");
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const deactivate = async (u) => {
    try {
      const res = await api.deactivateUser(u.id);
      if (res.success) { toast(`${u.fullName} deactivated.`); loadUsers(); }
      else toast(res.message || "Operation failed.", "error");
    } catch (e) { toast(e.message, "error"); }
  };

  return (
    <div className="page-enter">
      <div className="sec-hd mb-20">
        <div><span className="sec-title">User Management</span><span className="sec-sub">{users.filter(u => u.active).length} active</span></div>
        <button className="btn btn-primary" onClick={() => { setForm({ fullName: "", email: "", password: "", role: "MEMBER" }); setModal(true); }}>＋ Register User</button>
      </div>

      {error && <ApiError error={error} onRetry={loadUsers} />}

      <div className="tab-row">
        {[["ALL", "All Users", users.length], ["MEMBER", "Members", users.filter(u => u.role === "MEMBER").length], ["LIBRARIAN", "Librarians", users.filter(u => u.role === "LIBRARIAN").length]].map(([k, l, c]) => (
          <div key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l}<span className="tab-n">{c}</span></div>
        ))}
      </div>

      <div className="panel">
        <div className="table-scroll">
          {loading ? <Loader text="Loading users from API…" /> :
            filtered.length === 0
              ? <div className="empty"><div className="empty-icon">👤</div><h3>No users found</h3></div>
              : <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th></th></tr></thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="row" style={{ gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${u.role === "LIBRARIAN" ? "var(--violet),#5B3DAA" : "var(--cyan),#0077AA"})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--void)", flexShrink: 0 }}>
                            {u.fullName?.[0]}
                          </div>
                          <strong>{u.fullName}</strong>
                        </div>
                      </td>
                      <td className="mono">{u.email}</td>
                      <td><Badge s={u.role} /></td>
                      <td><Badge s={u.active ? "Active" : "Inactive"} /></td>
                      <td className="mono">{u.createdAt?.substring(0, 10)}</td>
                      <td>{u.active && <button className="btn btn-danger btn-sm" onClick={() => deactivate(u)}>Deactivate</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </div>

      {modal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-head">
              <div><div className="modal-title">Register User</div><div className="modal-sub">Add a librarian or member account</div></div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="form-group span-2"><label>Full Name *</label><input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Jane Doe" /></div>
                <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" /></div>
                <div className="form-group"><label>Password</label><input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" /></div>
                <div className="form-group"><label>Role</label><select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}><option value="MEMBER">Member</option><option value="LIBRARIAN">Librarian</option></select></div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-subtle" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Registering…" : "Register"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Transactions Page ────────────────────────────────────────────────────────

function TransactionsPage({ toast, onOverdueChange }) {
  const [transactions, setTransactions] = useState([]);
  const [availBooks, setAvailBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("ALL");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ userId: "", bookId: "" });

  const loadAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [txns, books, users, overdue] = await Promise.all([
        api.getTransactions(),
        api.getAvailableBooks(),
        api.getUsers(),
        api.getOverdueTransactions(),
      ]);
      setTransactions(txns);
      setAvailBooks(books);
      setMembers(users.filter(u => u.role === "MEMBER" && u.active));
      onOverdueChange(overdue.length);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const counts = {
    ALL: transactions.length,
    ACTIVE: transactions.filter(t => t.status === "ACTIVE").length,
    OVERDUE: transactions.filter(t => t.status === "OVERDUE").length,
    RETURNED: transactions.filter(t => t.status === "RETURNED").length,
  };
  const filtered = transactions.filter(t => tab === "ALL" || t.status === tab);

  const borrow = async () => {
    if (!form.userId || !form.bookId) { toast("Select a member and a book.", "error"); return; }
    setSaving(true);
    try {
      const res = await api.borrowBook({ userId: Number(form.userId), bookId: Number(form.bookId) });
      if (res.success) {
        toast(`"${res.data.bookTitle}" issued to ${res.data.memberName}. Due: ${res.data.dueDate}`);
        setModal(false); setForm({ userId: "", bookId: "" });
        loadAll();
      } else toast(res.message || "Borrow failed.", "error");
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const ret = async (t) => {
    try {
      const res = await api.returnBook({ transactionId: t.id });
      if (res.success) {
        const fine = parseFloat(res.data.fine || 0);
        toast(fine > 0 ? `"${res.data.bookTitle}" returned. Fine: $${res.data.fine}` : `"${res.data.bookTitle}" returned on time. No fine.`);
        loadAll();
      } else toast(res.message || "Return failed.", "error");
    } catch (e) { toast(e.message, "error"); }
  };

  return (
    <div className="page-enter">
      <div className="sec-hd mb-20">
        <div><span className="sec-title">Transactions</span><span className="sec-sub">{transactions.length} total records</span></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>＋ Issue Book</button>
      </div>

      {error && <ApiError error={error} onRetry={loadAll} />}

      <div className="tab-row">
        {[["ALL", "All"], ["ACTIVE", "Active"], ["OVERDUE", "Overdue"], ["RETURNED", "Returned"]].map(([k, l]) => (
          <div key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l}<span className="tab-n">{counts[k] || 0}</span></div>
        ))}
      </div>

      <div className="panel">
        <div className="table-scroll">
          {loading ? <Loader text="Loading transactions from API…" /> :
            filtered.length === 0
              ? <div className="empty"><div className="empty-icon">📋</div><h3>No transactions</h3><p>Issue a book to get started.</p></div>
              : <table>
                <thead><tr><th>ID</th><th>Member</th><th>Book</th><th>Copy Code</th><th>Issue</th><th>Due</th><th>Returned</th><th>Fine</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id}>
                      <td className="mono" style={{ fontSize: 10.5 }}>#{String(t.id).padStart(6, "0")}</td>
                      <td><strong>{t.memberName}</strong></td>
                      <td><span className="truncate" style={{ display: "block", maxWidth: 150 }}>{t.bookTitle}</span></td>
                      <td className="mono" style={{ fontSize: 10.5 }}>{t.copyCode}</td>
                      <td className="mono">{t.issueDate}</td>
                      <td className="mono" style={{ color: t.status === "OVERDUE" && !t.returnDate ? "var(--rose)" : "inherit" }}>{t.dueDate}</td>
                      <td className="mono">{t.returnDate || <span className="text-dim">—</span>}</td>
                      <td>
                        {t.fine != null
                          ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: parseFloat(t.fine) > 0 ? "var(--rose)" : "var(--green)", fontWeight: 500 }}>${t.fine}</span>
                          : <span className="text-dim">—</span>}
                      </td>
                      <td><Badge s={t.status} /></td>
                      <td>{t.status === "ACTIVE" && <button className="btn btn-ghost btn-sm" onClick={() => ret(t)}>Return</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </div>

      {modal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-head">
              <div><div className="modal-title">Issue a Book</div><div className="modal-sub">Assign a physical copy · 14-day loan · $0.50/day fine</div></div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Member *</label>
                  <select value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}>
                    <option value="">Select a member…</option>
                    {members.map(u => <option key={u.id} value={u.id}>{u.fullName} · {u.email}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Book *</label>
                  <select value={form.bookId} onChange={e => setForm(f => ({ ...f, bookId: e.target.value }))}>
                    <option value="">Select a book…</option>
                    {availBooks.map(b => <option key={b.id} value={b.id}>{b.title} — {b.availableCopies} available</option>)}
                  </select>
                </div>
                {form.userId && form.bookId && (
                  <div style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: "var(--r)", padding: "14px 16px" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 9 }}>Loan Summary</div>
                    {[["Issue Date", today(), "var(--cyan)"], ["Due Date", addDays(today(), 14), "var(--cyan)"], ["Fine Rate", "$0.50 / day overdue", "var(--amber)"]].map(([l, v, c]) => (
                      <div key={l} className="row-between" style={{ marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: "var(--text-2)" }}>{l}</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: c }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-subtle" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={borrow} disabled={saving}>{saving ? "Issuing…" : "Issue Book"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────

const NAV = [
  { key: "dashboard", icon: "⊞", label: "Dashboard" },
  { key: "books", icon: "📚", label: "Catalogue" },
  { key: "transactions", icon: "↔", label: "Transactions" },
  { key: "users", icon: "👥", label: "Users" },
];
const TITLES = { dashboard: "Dashboard", books: "Book Catalogue", transactions: "Transactions", users: "Users" };

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [overdue, setOverdue] = useState(0);
  const { toasts, toast, dismiss } = useToast();

  // Dashboard aggregated data — fetched once, passed down
  const [dashData, setDashData] = useState({ books: [], users: [], transactions: [], overdueList: [] });
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setDashLoading(true); setDashError(null);
    try {
      const [books, users, transactions, overdueList] = await Promise.all([
        api.getBooks(),
        api.getUsers(),
        api.getTransactions(),
        api.getOverdueTransactions(),
      ]);
      setDashData({ books, users, transactions, overdueList });
      setOverdue(overdueList.length);
    } catch (e) {
      setDashError(e.message);
    } finally {
      setDashLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Reload dashboard when switching back to it
  useEffect(() => { if (page === "dashboard") loadDashboard(); }, [page]);

  return (
    <>
      <style>{STYLES}</style>
      <div className="bg-orbs">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      </div>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-logo">
              <div className="brand-icon">📖</div>
              <div className="brand-text"><h1>Libra</h1><p>Management System</p></div>
            </div>
            <div className="sidebar-status"><div className="status-dot" />System Online</div>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-group-label">Navigation</div>
            {NAV.map(n => (
              <div key={n.key} className={`nav-item ${page === n.key ? "active" : ""}`} onClick={() => setPage(n.key)}>
                <span className="nav-icon">{n.icon}</span>{n.label}
                {n.key === "transactions" && overdue > 0 && <span className="nav-badge">{overdue}</span>}
              </div>
            ))}
          </nav>
          <div className="sidebar-mini">
            <div className="mini-label">Live Stats</div>
            {[
              ["Books", dashData.books.length, "var(--cyan)"],
              ["Users", dashData.users.length, "var(--violet)"],
              ["Active Loans", dashData.transactions.filter(t => t.status === "ACTIVE").length, "var(--amber)"],
            ].map(([l, v, c]) => (
              <div key={l} className="mini-row">
                <span style={{ fontSize: 11.5, color: "var(--text-2)" }}>{l}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: c, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="sidebar-footer"><span>Spring Boot 3</span><span className="version-tag">v1.0.0</span></div>
        </aside>

        <div className="main">
          <header className="topbar">
            <div className="topbar-left">
              <div>
                <div className="breadcrumb">libra / <span>{page}</span></div>
                <div className="page-title">{TITLES[page]}</div>
              </div>
            </div>
            <div className="topbar-right">
              <div className="search-wrap">
                <span style={{ color: "var(--text-3)" }}>⌕</span>
                <input placeholder="Search anything…" />
              </div>
              <div className="icon-btn" title="Notifications">
                {overdue > 0 && <div className="notif-dot" />}🔔
              </div>
              <div className="icon-btn" title="Refresh" onClick={loadDashboard} style={{ cursor: "pointer" }}>⟳</div>
              <div className="avatar">L</div>
            </div>
          </header>

          <div className="content">
            {page === "dashboard" && (
              dashLoading
                ? <Loader text="Connecting to Spring Boot API…" />
                : dashError
                  ? <ApiError error={dashError} onRetry={loadDashboard} />
                  : <Dashboard {...dashData} />
            )}
            {page === "books" && <BooksPage toast={toast} />}
            {page === "users" && <UsersPage toast={toast} />}
            {page === "transactions" && <TransactionsPage toast={toast} onOverdueChange={setOverdue} />}
          </div>
        </div>
      </div>
      <Toasts toasts={toasts} dismiss={dismiss} />
    </>
  );
}
