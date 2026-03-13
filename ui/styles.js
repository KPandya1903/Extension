window.QF = window.QF || {};

QF.SHEET = `
  :host { position: fixed; bottom: 28px; right: 28px; left: auto; z-index: 2147483647; }
  .wrap { width: 52px; min-width: 52px; position: relative; }
  button { all: unset; box-sizing: border-box; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .main-btn { width: 52px; height: 52px; min-width: 52px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); box-shadow: 0 4px 14px rgba(59,130,246,0.5); transition: transform 0.2s, box-shadow 0.2s; outline: none; }
  .main-btn:hover { transform: scale(1.08); box-shadow: 0 6px 18px rgba(59,130,246,0.6); }
  .sub-btn { position: absolute; right: 0; bottom: 52px; width: 44px; height: 44px; min-width: 44px; min-height: 44px; border-radius: 50%; background: linear-gradient(135deg, #64748b 0%, #475569 100%); box-shadow: 0 2px 8px rgba(0,0,0,0.2); color: #ffffff; transform-origin: right center; outline: none; overflow: visible; }
  .sub-btn .qc-inner { position: relative; width: 22px; height: 22px; min-width: 22px; min-height: 22px; max-width: 22px; max-height: 22px; flex: 0 0 22px; contain: layout size; overflow: hidden; color: #ffffff; }
  .sub-btn .qc-inner .qc-icon, .sub-btn .qc-inner .qc-check { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
  .sub-btn .qc-inner .qc-check { opacity: 0; pointer-events: none; }
  .sub-btn.copied .qc-inner .qc-icon { opacity: 0; }
  .sub-btn.copied .qc-inner .qc-check { opacity: 1; }
  .sub-btn .qc-letter { font-size: 16px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #ffffff; line-height: 1; flex-shrink: 0; }
  .sub-btn .qc-inner svg { display: block; width: 22px; height: 22px; min-width: 22px; min-height: 22px; max-width: 22px; max-height: 22px; flex: 0 0 22px; flex-shrink: 0; }
  .sub-btn .qc-inner .qc-favicon { width: 22px; height: 22px; min-width: 22px; min-height: 22px; max-width: 22px; max-height: 22px; object-fit: contain; display: block; flex-shrink: 0; }
  .sub-btn .qc-label { position: absolute; right: 52px; top: 50%; transform: translateY(-50%); white-space: nowrap; background: rgba(30,30,30,0.95); color: #fff; font-size: 12px; font-weight: 500; padding: 6px 10px; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; pointer-events: none; }
  .sub-btn.qc-config-btn { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); }
  .toast { position: fixed; bottom: 100px; right: 28px; z-index: 2147483647; background: rgba(20,20,20,0.93); color: #fff; font-size: 13px; font-weight: 500; padding: 8px 16px; border-radius: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.3); pointer-events: none; }
  .qc-panel { position: fixed; bottom: 28px; right: 90px; width: 420px; max-height: 80vh; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px) saturate(180%); -webkit-backdrop-filter: blur(12px) saturate(180%); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,0.15); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; z-index: 2147483646; display: flex; flex-direction: column; overflow: hidden; animation: qc-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
  @keyframes qc-slide-in { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  .qc-panel-header {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    padding: 16px;
    font-weight: 600;
    font-size: 15px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }

  /* Tabs UI */
  .qc-tabs-nav {
    display: flex;
    background: rgba(255,255,255,0.3);
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }
  .qc-tab-btn {
    flex: 1;
    padding: 10px;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: #4b5563;
    transition: all 0.2s;
  }
  .qc-tab-btn:hover { background: rgba(255,255,255,0.4); }
  .qc-tab-btn.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
    background: rgba(255,255,255,0.5);
  }
  .qc-tab-content { display: none; }
  .qc-tab-content.active { display: block; }

  .qc-panel-body {
    padding: 16px;
    overflow-y: auto;
    flex: 1;
    scrollbar-width: thin;
  }

  .qc-identity-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .qc-identity-grid input {
    padding: 10px;
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 8px;
    font-size: 13px;
    background: rgba(255,255,255,1);
  }
  .qc-identity-grid button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 10px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .qc-identity-grid button:hover { background: #2563eb; }
  .qc-panel .qc-add-row { display: flex; gap: 10px; margin-bottom: 20px; background: rgba(0,0,0,0.03); padding: 12px; border-radius: 12px; }
  .qc-panel input, .qc-panel select { flex: 1; padding: 10px 14px; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; font-size: 13px; pointer-events: auto; background: #fff; transition: border-color 0.2s; }
  .qc-panel input:focus { border-color: #3b82f6; outline: none; }
  .qc-panel .qc-btn-add { padding: 10px 16px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
  .qc-panel .qc-btn-add:hover { background: #2563eb; }
  .qc-panel .qc-btn-add:disabled { background: #cbd5e1; cursor: not-allowed; }
  .qc-panel .qc-preset-list { display: flex; flex-direction: column; gap: 10px; }
  .qc-panel .qc-preset-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.5); border-radius: 12px; border: 2px solid transparent; transition: all 0.2s; }
  .qc-panel .qc-preset-item:hover { background: rgba(255,255,255,0.8); transform: translateY(-1px); }
  .qc-panel .qc-drag-handle { display: flex; align-items: center; cursor: grab; flex-shrink: 0; color: #94a3b8; }
  .qc-panel .qc-preset-item .qc-preset-label { font-size: 14px; font-weight: 600; color: #1e293b; }
  .qc-panel .qc-preset-item .qc-preset-text { font-size: 12px; color: #64748b; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px; }
  .qc-panel .qc-preset-item button { padding: 6px 10px; font-size: 12px; background: transparent; border: none; cursor: pointer; color: #64748b; border-radius: 6px; transition: all 0.2s; }
  .qc-panel .qc-preset-item button:hover { color: #3b82f6; background: #eff6ff; }
  .qc-panel .qc-preset-item .qc-btn-del:hover { color: #ef4444; background: #fef2f2; }
  .qc-panel .qc-preset-item { cursor: grab; user-select: none; }
  .qc-panel .qc-preset-item:active { cursor: grabbing; }
  .qc-panel .qc-preset-item.dragging { opacity: 0.5; transform: scale(0.98); }
  .qc-panel .qc-preset-item.drag-over { border: 2px dashed #3b82f6; background: #eff6ff; }
  .qc-panel .qc-empty { font-size: 14px; color: #64748b; padding: 32px 16px; text-align: center; }
  .qc-panel .qc-max-hint { font-size: 12px; color: #64748b; margin-bottom: 12px; opacity: 0.8; }
  .qc-panel-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.15); backdrop-filter: blur(4px); z-index: 2147483645; }
  .qc-palette-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(8px); z-index: 2147483647; display: flex; justify-content: center; align-items: flex-start; padding-top: 15vh; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; animation: qc-fade-in 0.2s ease-out; }
  @keyframes qc-fade-in { from { opacity: 0; } to { opacity: 1; } }
  .qc-palette { width: 90%; max-width: 600px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); overflow: hidden; display: flex; flex-direction: column; border: 1px solid rgba(255,255,255,0.4); }
  .qc-palette-input { width: 100%; border: none; border-bottom: 1px solid rgba(0,0,0,0.06); padding: 22px 28px; font-size: 20px; outline: none; background: transparent; color: #111; font-weight: 500; }
  .qc-palette-list { max-height: 450px; overflow-y: auto; padding: 10px; }
  .qc-palette-item { display: flex; flex-direction: column; justify-content: center; padding: 14px 20px; border-radius: 12px; cursor: pointer; transition: all 0.2s; margin-bottom: 2px; }
  .qc-palette-item:last-child { border-bottom: none; }
  .qc-palette-item.qc-selected { background: #3b82f6; color: #fff; }
  .qc-palette-item.qc-selected .qc-palette-label { color: #fff; }
  .qc-palette-item.qc-selected .qc-palette-content { color: rgba(255,255,255,0.8); }
  .qc-palette-item.qc-selected .qc-palette-type { background: rgba(255,255,255,0.2); color: #fff; }
  .qc-palette-label { font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 4px; display: flex; align-items: center; }
  .qc-palette-content { font-size: 13px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .qc-palette-empty { padding: 40px; text-align: center; color: #64748b; font-size: 15px; }
  .qc-palette-type { font-size: 11px; font-weight: 700; background: #f1f5f9; padding: 3px 8px; border-radius: 6px; margin-left: auto; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
  @media (prefers-color-scheme: dark) {
    .qc-panel { background: rgba(30, 30, 30, 0.85); border-color: rgba(255,255,255,0.1); }
    .qc-panel-header { border-color: rgba(255,255,255,0.1); color: #f8fafc; }
    .qc-panel-body { color: #f8fafc; }
    .qc-panel .qc-add-row { background: rgba(255,255,255,0.05); }
    .qc-panel input, .qc-panel select { background: #1e293b; border-color: rgba(255,255,255,0.1); color: #f8fafc; }
    .qc-panel input::placeholder { color: #94a3b8; }
    .qc-panel .qc-preset-item { background: rgba(255,255,255,0.05); }
    .qc-panel .qc-preset-item:hover { background: rgba(255,255,255,0.1); }
    .qc-panel .qc-preset-item .qc-preset-label { color: #f1f5f9; }
    .qc-panel .qc-preset-item .qc-preset-text { color: #94a3b8; }
    .qc-panel .qc-preset-item button { color: #94a3b8; }
    .qc-panel .qc-preset-item button:hover { color: #60a5fa; background: rgba(59,130,246,0.1); }
    .qc-panel .qc-preset-item .qc-btn-del:hover { color: #f87171; background: rgba(239,68,68,0.1); }
    .qc-panel .qc-empty { color: #94a3b8; }
    .qc-palette { background: rgba(15, 23, 42, 0.9); border-color: rgba(255,255,255,0.1); }
    .qc-palette-input { border-color: rgba(255,255,255,0.1); color: #f8fafc; }
    .qc-palette-item.qc-selected { background: #2563eb; }
    .qc-palette-label { color: #f1f5f9; }
    .qc-palette-content { color: #94a3b8; }
    .qc-palette-type { background: rgba(255,255,255,0.1); color: #cbd5e1; }
  }
`;
