import { useState, useRef, useCallback, useEffect, useMemo } from "react";

const FASTAPI_BASE_URL = (import.meta?.env?.VITE_FASTAPI_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

const CSS = `
:root {
  --bg: #0b1220;
  --card: rgba(255,255,255,0.06);
  --card2: rgba(255,255,255,0.08);
  --stroke: rgba(255,255,255,0.12);
  --text: rgba(255,255,255,0.92);
  --muted: rgba(255,255,255,0.65);
  --accent: #7c3aed;
  --shadow: 0 10px 30px rgba(0,0,0,0.35);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  min-height: 100vh;
  background:
    radial-gradient(1200px 800px at 15% 0%, rgba(124,58,237,0.25), transparent 55%),
    radial-gradient(1200px 800px at 85% 10%, rgba(6,182,212,0.22), transparent 60%),
    radial-gradient(900px 600px at 60% 90%, rgba(34,197,94,0.18), transparent 60%),
    var(--bg);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  color: var(--text);
}
.app { max-width: 1100px; margin: 0 auto; padding: 32px 20px 80px; }
h1 { font-size: 2rem; font-weight: 900; color: #fff; margin-bottom: 4px; }
.subtitle { color: var(--muted); font-size: 0.88rem; margin-bottom: 28px; line-height: 1.5; }
.panel {
  background: var(--card);
  border: 1px solid var(--stroke);
  border-radius: 18px;
  padding: 18px 20px;
  box-shadow: var(--shadow);
}
.section-title { color: #fff; font-weight: 900; font-size: 1rem; margin-bottom: 12px; }
.row { display: flex; gap: 16px; flex-wrap: wrap; }
.col { flex: 1; min-width: 260px; display: flex; flex-direction: column; gap: 14px; }
.btn {
  cursor: pointer; border: none; border-radius: 12px; padding: 11px 24px;
  font-weight: 800; font-size: 0.92rem; transition: opacity .15s, transform .1s;
  display: inline-flex; align-items: center; gap: 7px;
}
.btn:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
.btn:disabled { opacity: .38; cursor: not-allowed; }
.btn-primary { background: linear-gradient(135deg,#7c3aed,#06b6d4); color: #fff; }
.btn-success { background: rgba(34,197,94,0.22); color: #4ade80; border: 1px solid rgba(34,197,94,0.4); }
.btn-export { background: linear-gradient(135deg,#059669,#0891b2); color: #fff; }
.btn-danger { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
.upload-zone {
  border: 2px dashed var(--stroke); border-radius: 18px; padding: 36px 20px;
  text-align: center; cursor: pointer; color: var(--muted);
  transition: border-color .2s, background .2s;
}
.upload-zone:hover, .upload-zone.drag { border-color: #7c3aed; background: rgba(124,58,237,0.07); }
.upload-zone input { display: none; }
.upload-icon { font-size: 2.2rem; margin-bottom: 10px; }
.upload-label { font-weight: 800; color: #fff; font-size: 1rem; }
.upload-sub { font-size: .82rem; margin-top: 5px; }
.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 8px; margin-top: 14px; }
.thumb {
  aspect-ratio: 1; border-radius: 10px; overflow: hidden; cursor: pointer;
  border: 2px solid transparent; transition: border-color .15s, transform .1s;
  position: relative;
}
.thumb:hover { transform: scale(1.03); }
.thumb.active { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.3); }
.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.thumb .badge {
  position: absolute; bottom: 4px; right: 4px;
  width: 20px; height: 20px; border-radius: 999px; font-size: 11px;
  display: flex; align-items: center; justify-content: center; font-weight: 900;
}
.badge-ok { background: rgba(34,197,94,0.9); color: #fff; }
.badge-warn { background: rgba(245,158,11,0.9); color: #fff; }
.badge-pending { background: rgba(255,255,255,0.2); color: #fff; }
.thumb-name {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: #fff; font-size: 9px; font-weight: 700;
  padding: 10px 4px 4px; text-align: center;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.preview-img { width: 100%; border-radius: 16px; object-fit: contain; max-height: 380px; background: rgba(0,0,0,0.25); display: block; }
.filename { color: var(--muted); font-size: .82rem; text-align: center; margin-top: 6px; }
.kv-wrap { display: flex; flex-direction: column; gap: 8px; }
.kv {
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  padding: 10px 14px; border-radius: 12px; background: var(--card2); border: 1px solid var(--stroke);
}
.kv .k { color: var(--muted); font-weight: 800; font-size: .83rem; white-space: nowrap; }
.kv .v { color: #fff; font-weight: 900; font-size: .9rem; text-align: right; }
.kv .v.empty { color: var(--muted); font-weight: 400; font-style: italic; }
.chip-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  padding: 6px 13px; border-radius: 999px; background: rgba(124,58,237,0.18);
  border: 1px solid rgba(124,58,237,0.35); color: #c4b5fd; font-weight: 800; font-size: .8rem;
}
.ok-box {
  color: #d1fae5; background: rgba(34,197,94,0.12);
  border: 1px solid rgba(34,197,94,0.3); padding: 11px 16px; border-radius: 13px; font-size:.88rem; font-weight: 600;
}
.warn-box {
  color: #fef3c7; background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.3); padding: 11px 16px; border-radius: 13px; font-size:.88rem; font-weight: 600;
}
.err-box {
  color: #fee2e2; background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3); padding: 11px 16px; border-radius: 13px; font-size:.88rem; font-weight: 600;
}
.muted-box { color: var(--muted); font-size: .88rem; padding: 8px 0; }
.edited-badge {
  display: inline-flex; align-items: center; gap: 5px;
  background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.4);
  color: #c4b5fd; font-size: .75rem; font-weight: 800; padding: 3px 10px; border-radius: 999px;
  margin-left: 10px;
}
.progress-bar {
  width: 100%; height: 10px; border-radius: 999px;
  background: rgba(255,255,255,0.1); overflow: hidden; margin-top: 10px;
}
.progress-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, #22c55e, #06b6d4, #7c3aed);
  transition: width .3s ease;
}
.wn-select {
  width: 100%; padding: 10px 13px; border-radius: 11px;
  background: rgba(255,255,255,0.08); color: #fff;
  border: 1px solid var(--stroke); font-size: .9rem; outline: none;
  transition: border-color .15s;
}
.wn-select:focus { border-color: #7c3aed; }
.wn-select option { background: #1e293b; color: #fff; }
label.field-label { color: var(--muted); font-size: .8rem; font-weight: 800; display: block; margin-bottom: 5px; letter-spacing: .03em; text-transform: uppercase; }
.edit-section { margin-top: 20px; }
.edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 600px) { .edit-grid { grid-template-columns: 1fr; } }
.cb-group { display: flex; flex-wrap: wrap; gap: 7px; }
.cb-chip {
  cursor: pointer; padding: 6px 13px; border-radius: 999px; font-size: .8rem; font-weight: 800;
  border: 1px solid var(--stroke); color: var(--muted); transition: all .15s; user-select: none;
}
.cb-chip:hover { border-color: #7c3aed; color: #fff; }
.cb-chip.selected { background: rgba(124,58,237,0.25); border-color: #7c3aed; color: #c4b5fd; }
.save-bar {
  display: flex; align-items: center; gap: 12px; margin-top: 6px; flex-wrap: wrap;
}
.spacer { height: 16px; }
.divider { height: 1px; background: var(--stroke); margin: 20px 0; }
.export-section { margin-top: 24px; }
.export-card {
  background: linear-gradient(135deg, rgba(5,150,105,0.12), rgba(8,145,178,0.12));
  border: 1px solid rgba(5,150,105,0.3); border-radius: 18px; padding: 22px 24px;
}
.export-title { font-size: 1.05rem; font-weight: 900; color: #fff; margin-bottom: 6px; }
.export-desc { color: var(--muted); font-size: .86rem; line-height: 1.55; margin-bottom: 16px; }
.export-btns { display: flex; gap: 10px; flex-wrap: wrap; }
.strapi-status { margin-top: 12px; }
.overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(8,14,26,0.85); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
}
.overlay-inner {
  text-align: center; padding: 32px 36px; border-radius: 22px;
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
  box-shadow: 0 24px 70px rgba(0,0,0,0.5); min-width: 340px; max-width: 90vw;
}
.spinner {
  width: 46px; height: 46px; border-radius: 999px; margin: 0 auto;
  border: 4px solid rgba(255,255,255,0.15); border-top-color: rgba(255,255,255,0.9);
  animation: spin 0.85s linear infinite;
}
.overlay-text { color: #fff; font-weight: 900; font-size: 1.1rem; margin-top: 16px; }
.overlay-sub { color: var(--muted); font-size: .85rem; margin-top: 6px; }
.overlay-pct { color: #4ade80; font-weight: 900; font-size: 1.1rem; margin-top: 12px; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.stat-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
.stat-pill {
  padding: 5px 14px; border-radius: 999px; font-size: .8rem; font-weight: 800;
  background: var(--card2); border: 1px solid var(--stroke); color: var(--muted);
}
.stat-pill span { color: #fff; margin-left: 4px; }
`;

function injectStyles() {
  if (document.getElementById("wn-styles")) return;
  const s = document.createElement("style");
  s.id = "wn-styles";
  s.textContent = CSS;
  document.head.appendChild(s);
}

function extractPrediction(data) {
  if (!data) return null;

  // Shape 1: { timestamp, image_name, source, prediction: { category, subcategory, ... } }
  if (data.prediction && typeof data.prediction === "object") {
    const p = data.prediction;
    if (p.warning) return { _geminiWarning: p.warning };
    return {
      category: p.category ?? null,
      subcategory: p.subcategory ?? null,
      colour: p.colour ?? p.color ?? null,
      pattern: p.pattern ?? null,
      fit: p.fit ?? null,
      features: Array.isArray(p.features) ? p.features : [],
    };
  }

  // Shape 2: { layers: [{ primary_category, subcategory, color, pattern, fit, features }] }
  if (data.layers && Array.isArray(data.layers) && data.layers.length > 0) {
    const l = data.layers[0];
    return {
      category: l.primary_category ?? null,
      subcategory: l.subcategory ?? null,
      colour: Array.isArray(l.color) ? l.color.join(", ") : (l.color ?? null),
      pattern: l.pattern ?? null,
      fit: l.fit ?? null,
      features: Array.isArray(l.features) ? l.features : [],
    };
  }

  // Shape 3: flat { category, subcategory, colour, pattern, fit, features }
  if (data.category !== undefined || data.subcategory !== undefined) {
    return {
      category: data.category ?? null,
      subcategory: data.subcategory ?? null,
      colour: data.colour ?? data.color ?? null,
      pattern: data.pattern ?? null,
      fit: data.fit ?? null,
      features: Array.isArray(data.features) ? data.features : [],
    };
  }

  // Shape 4: { _warning: "..." }
  if (data._warning) return { _geminiWarning: data._warning };

  return null;
}

async function apiHealth() {
  try {
    const r = await fetch(`${FASTAPI_BASE_URL}/health`, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    return { status: "error", message: String(e) };
  }
}

async function apiGetTaxonomy() {
  try {
    const r = await fetch(`${FASTAPI_BASE_URL}/taxonomy`, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    return {
      categories: data.categories || [],
      subcategories: data.subcategories || [],
      colours: data.colours || [],
      patterns: data.patterns || [],
      fits: data.fits || [],
      features: data.features || [],
    };
  } catch {
    return { categories: [], subcategories: [], colours: [], patterns: [], fits: [], features: [] };
  }
}

async function apiPredictImage(file) {
  const form = new FormData();
  form.append("file", file, file.name);
  try {
    const r = await fetch(`${FASTAPI_BASE_URL}/predict`, {
      method: "POST", body: form, signal: AbortSignal.timeout(180000),
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      return { _error: `Server returned ${r.status}: ${txt}` };
    }
    const raw = await r.json();
    console.log("[WearNext] Raw API response for", file.name, ":", JSON.stringify(raw, null, 2));
    const pred = extractPrediction(raw);
    console.log("[WearNext] Extracted prediction:", pred);
    if (!pred) return { _error: "Unrecognised response shape. Check browser console (F12) for raw response." };
    if (pred._geminiWarning) return { _error: `Gemini error: ${pred._geminiWarning}` };
    const hasAnyData = pred.category || pred.subcategory || pred.colour || pred.pattern || pred.fit || (pred.features && pred.features.length > 0);
    if (!hasAnyData) {
      console.warn("[WearNext] All prediction fields empty. Raw response:", JSON.stringify(raw, null, 2));
      return { _error: "Gemini returned empty results. Open browser console (F12) to see the raw response and check GOOGLE_API_KEY + taxonomy files." };
    }
    // ── FIX: Capture the server-side persistent image path so it can be sent
    // to Strapi during export. The backend saves the image to IMAGES_DIR and
    // returns the path in the top-level `image_path` field of the response. ──
    return { ...pred, _serverImagePath: raw.image_path ?? null };
  } catch (e) {
    return { _error: `Request failed: ${String(e)}` };
  }
}

async function apiExportToStrapi(items) {
  const payload = {
    items: items.map((it) => {
      const d = it.final || it.pred;
      return {
        image_name: it.name,
        // ── FIX: Send the persistent server-side path instead of hardcoded null
        // so the backend can read and upload the image file to Strapi ──
        image_path: it._serverImagePath ?? null,
        edited: it.edited || false,
        prediction: {
          category: d?.category ?? null,
          subcategory: d?.subcategory ?? null,
          colour: d?.colour ?? null,
          pattern: d?.pattern ?? null,
          fit: d?.fit ?? null,
          features: d?.features || [],
          warning: it._error ?? null,
        },
      };
    }),
    push_to_strapi: true,
  };
  const r = await fetch(`${FASTAPI_BASE_URL}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60000),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`Export failed: ${r.status} ${txt}`);
  }
  return await r.json();
}

function KVRow({ label, value }) {
  const empty = !value;
  return (
    <div className="kv">
      <span className="k">{label}</span>
      <span className={`v${empty ? " empty" : ""}`}>{value || "not detected"}</span>
    </div>
  );
}

function FeatureChips({ features }) {
  if (!features || features.length === 0)
    return <div className="muted-box">No features detected.</div>;
  return (
    <div className="chip-wrap">
      {features.map((f, i) => <span key={i} className="chip">{f}</span>)}
    </div>
  );
}

function SelectField({ label, value, choices, onChange }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select
        className="wn-select"
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">— not set —</option>
        {choices.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );
}

function CheckboxGroup({ label, value = [], choices, onChange }) {
  const toggle = (item) => {
    const next = value.includes(item)
      ? value.filter((x) => x !== item)
      : [...value, item];
    onChange(next);
  };
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="cb-group">
        {choices.map((c) => (
          <span
            key={c}
            className={`cb-chip${value.includes(c) ? " selected" : ""}`}
            onClick={() => toggle(c)}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function WearNextApp() {
  injectStyles();

  const [health, setHealth] = useState(null);
  const [taxonomy, setTaxonomy] = useState({
    categories: [], subcategories: [], colours: [], patterns: [], fits: [], features: [],
  });
  const [items, setItems] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [nextIdx, setNextIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [loadingPct, setLoadingPct] = useState(0);
  const [statusMsg, setStatusMsg] = useState(null);
  const [strapiStatus, setStrapiStatus] = useState(null);
  const [drag, setDrag] = useState(false);

  const [editOverrides, setEditOverrides] = useState({});
  const [editSaved, setEditSaved] = useState(false);
  const [lastEditedIdx, setLastEditedIdx] = useState(null);

  const fileInputRef = useRef();

  useEffect(() => {
    apiHealth().then(setHealth);
    apiGetTaxonomy().then(setTaxonomy);
  }, []);

  const selected = selectedIdx !== null ? items[selectedIdx] : null;
  const finalData = selected ? (selected.final || selected.pred) : null;

  const baseEdit = useMemo(() => {
    if (!finalData) return { category: null, subcategory: null, colour: null, pattern: null, fit: null, features: [] };
    return {
      category: finalData.category || null,
      subcategory: finalData.subcategory || null,
      colour: finalData.colour || null,
      pattern: finalData.pattern || null,
      fit: finalData.fit || null,
      features: Array.isArray(finalData.features) ? finalData.features : [],
    };
  }, [finalData]);

  const editFields = lastEditedIdx === selectedIdx ? { ...baseEdit, ...editOverrides } : baseEdit;

  const setEditCat = (v) => { setEditOverrides((o) => ({ ...o, category: v })); setEditSaved(false); setLastEditedIdx(selectedIdx); };
  const setEditSubcat = (v) => { setEditOverrides((o) => ({ ...o, subcategory: v })); setEditSaved(false); setLastEditedIdx(selectedIdx); };
  const setEditColour = (v) => { setEditOverrides((o) => ({ ...o, colour: v })); setEditSaved(false); setLastEditedIdx(selectedIdx); };
  const setEditPattern = (v) => { setEditOverrides((o) => ({ ...o, pattern: v })); setEditSaved(false); setLastEditedIdx(selectedIdx); };
  const setEditFit = (v) => { setEditOverrides((o) => ({ ...o, fit: v })); setEditSaved(false); setLastEditedIdx(selectedIdx); };
  const setEditFeatures = (v) => { setEditOverrides((o) => ({ ...o, features: v })); setEditSaved(false); setLastEditedIdx(selectedIdx); };

  const handleFiles = useCallback((files) => {
    if (!files || files.length === 0) return;
    const newItems = Array.from(files).map((f) => ({
      file: f,
      objectUrl: URL.createObjectURL(f),
      name: f.name,
      pred: null,
      final: null,
      edited: false,
      _error: null,
      timestamp: null,
      _serverImagePath: null, // ── FIX: slot for the persistent server-side path ──
    }));
    setItems(newItems);
    setSelectedIdx(0);
    setNextIdx(0);
    setStrapiStatus(null);
    setStatusMsg({ type: "ok", text: `${newItems.length} image(s) loaded. Click Process Next or Process All to classify.` });
  }, []);

  const processOne = useCallback(async (idx, currentItems) => {
    const it = currentItems[idx];
    if (!it) return currentItems;
    const result = await apiPredictImage(it.file);
    const now = new Date().toISOString();
    const updated = [...currentItems];
    if (result._error) {
      updated[idx] = { ...it, _error: result._error, pred: null, final: null, edited: false, timestamp: now };
    } else {
      updated[idx] = {
        ...it,
        _error: null,
        pred: result,
        final: result,
        edited: false,
        timestamp: now,
        // ── FIX: Store the server-side image path returned by /predict ──
        _serverImagePath: result._serverImagePath ?? null,
      };
    }
    return updated;
  }, []);

  const handleProcessNext = useCallback(async () => {
    if (items.length === 0) return;
    if (nextIdx >= items.length) {
      setStatusMsg({ type: "ok", text: "All images already processed." });
      return;
    }
    setLoading(true);
    setLoadingText(`Classifying image ${nextIdx + 1} of ${items.length}…`);
    setLoadingPct(Math.round((nextIdx / items.length) * 100));

    const updated = await processOne(nextIdx, items);
    setItems(updated);
    const newIdx = nextIdx + 1;
    setNextIdx(newIdx);
    setSelectedIdx(nextIdx);
    setLoading(false);
    setStatusMsg({ type: "ok", text: `Processed ${nextIdx + 1} of ${items.length}.` });
  }, [items, nextIdx, processOne]);

  const handleProcessAll = useCallback(async () => {
    if (items.length === 0) return;
    setLoading(true);
    let current = [...items];
    const n = current.length;
    let count = 0;

    for (let i = 0; i < n; i++) {
      if (current[i].final || current[i]._error) {
        count++;
        setLoadingText(`Skipping already processed: ${count}/${n}`);
        setLoadingPct(Math.round((count / n) * 100));
        continue;
      }
      setLoadingText(`Classifying image ${i + 1} of ${n}…`);
      setLoadingPct(Math.round((i / n) * 100));
      current = await processOne(i, current);
      count++;
      setItems([...current]);
      await new Promise((r) => setTimeout(r, 40));
    }

    setNextIdx(n);
    setItems(current);
    setSelectedIdx(0);
    setLoading(false);

    const errors = current.filter((it) => it._error).length;
    const ok = current.filter((it) => it.final).length;
    setStatusMsg({
      type: errors > 0 ? "warn" : "ok",
      text: `Done. ${ok} classified successfully${errors > 0 ? `, ${errors} failed` : ""}.`,
    });
  }, [items, processOne]);

  const handleSaveEdit = useCallback(() => {
    if (selectedIdx === null) return;
    const editedFinal = {
      category: editFields.category,
      subcategory: editFields.subcategory,
      colour: editFields.colour,
      pattern: editFields.pattern,
      fit: editFields.fit,
      features: editFields.features,
    };
    const updated = [...items];
    updated[selectedIdx] = {
      ...updated[selectedIdx],
      final: editedFinal,
      edited: true,
      _error: null,
      timestamp: new Date().toISOString(),
    };
    setItems(updated);
    setEditOverrides({});
    setLastEditedIdx(null);
    setEditSaved(true);
    setStatusMsg({ type: "ok", text: `Edits saved for "${items[selectedIdx].name}".` });
  }, [selectedIdx, items, editFields]);

  const buildExportPayload = useCallback(() => {
    return {
      created_at: new Date().toISOString(),
      backend_base_url: FASTAPI_BASE_URL,
      total: items.length,
      processed: items.filter((it) => it.final).length,
      items: items
        .filter((it) => it.final || it.pred)
        .map((it) => {
          const d = it.final || it.pred;
          return {
            timestamp: it.timestamp,
            image_name: it.name,
            edited: it.edited || false,
            prediction: {
              category: d?.category ?? null,
              subcategory: d?.subcategory ?? null,
              colour: d?.colour ?? null,
              pattern: d?.pattern ?? null,
              fit: d?.fit ?? null,
              features: d?.features || [],
              warning: it._error ?? null,
            },
          };
        }),
    };
  }, [items]);

  const handleDownloadJSON = useCallback(() => {
    const payload = buildExportPayload();
    if (payload.items.length === 0) {
      setStatusMsg({ type: "warn", text: "No processed images to export yet." });
      return;
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wearnext_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg({ type: "ok", text: `Downloaded JSON with ${payload.items.length} item(s).` });
  }, [buildExportPayload]);

  const handleExportToStrapi = useCallback(async () => {
    const ready = items.filter((it) => it.final || it.pred);
    if (ready.length === 0) {
      setStatusMsg({ type: "warn", text: "No processed images to push to Strapi." });
      return;
    }
    setLoading(true);
    setLoadingText("Pushing to Strapi…");
    setLoadingPct(50);
    setStrapiStatus(null);
    try {
      const result = await apiExportToStrapi(ready);
      setStrapiStatus({
        type: "ok",
        text: `Strapi: ${result.pushed} pushed, ${result.failed} failed.${result.failures?.length ? " Errors: " + result.failures.join("; ") : ""}`,
      });
      setStatusMsg({ type: "ok", text: "Export to Strapi complete." });
    } catch (e) {
      setStrapiStatus({ type: "err", text: String(e) });
      setStatusMsg({ type: "warn", text: "Strapi export failed. See details below." });
    }
    setLoading(false);
  }, [items]);

  const handleExportBoth = useCallback(async () => {
    handleDownloadJSON();
    await handleExportToStrapi();
  }, [handleDownloadJSON, handleExportToStrapi]);

  const processedCount = items.filter((it) => it.final || it._error).length;
  const successCount = items.filter((it) => it.final).length;
  const errorCount = items.filter((it) => it._error).length;

  const healthText = health
    ? `Backend: ${health.status} | Model: ${health.model || "N/A"} | Strapi: ${health.strapi_enabled ? "enabled" : "disabled"}`
    : "Connecting to backend…";

  return (
    <div className="app">
      {loading && (
        <div className="overlay">
          <div className="overlay-inner">
            <div className="spinner" />
            <div className="overlay-text">{loadingText}</div>
            <div style={{ marginTop: 16, width: 300, maxWidth: "80vw" }}>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${loadingPct}%` }} />
              </div>
            </div>
            <div className="overlay-pct">{loadingPct}%</div>
            <div className="overlay-sub">Please wait, this may take a moment…</div>
          </div>
        </div>
      )}

      <h1>WearNext Bulk Classifier</h1>
      <p className="subtitle">{healthText}</p>

      <div
        className={`upload-zone${drag ? " drag" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
      >
        <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={(e) => handleFiles(e.target.files)} />
        <div className="upload-icon">📂</div>
        <div className="upload-label">Drop images here or click to upload</div>
        <div className="upload-sub">Supports JPG, PNG, WEBP — multiple files supported</div>
      </div>

      {items.length > 0 && (
        <>
          <div className="spacer" />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button className="btn btn-primary" onClick={handleProcessNext} disabled={loading || nextIdx >= items.length}>
              ▶ Process Next
            </button>
            <button className="btn btn-primary" onClick={handleProcessAll} disabled={loading}>
              ⚡ Process All
            </button>
            {processedCount > 0 && (
              <div className="stat-row" style={{ margin: 0 }}>
                <div className="stat-pill">Total <span>{items.length}</span></div>
                <div className="stat-pill">Done <span>{successCount}</span></div>
                {errorCount > 0 && <div className="stat-pill">Errors <span>{errorCount}</span></div>}
              </div>
            )}
          </div>
        </>
      )}

      {statusMsg && (
        <div className={statusMsg.type === "ok" ? "ok-box" : "warn-box"} style={{ marginTop: 12 }}>
          {statusMsg.text}
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="spacer" />
          <div className="panel">
            <div className="section-title">Images ({items.length})</div>
            <div className="gallery">
              {items.map((it, i) => (
                <div
                  key={it.name + i}
                  className={`thumb${selectedIdx === i ? " active" : ""}`}
                  onClick={() => setSelectedIdx(i)}
                  title={it.name}
                >
                  <img src={it.objectUrl} alt={it.name} />
                  <div className="thumb-name">{it.name}</div>
                  {it.final && <div className="badge badge-ok">✓</div>}
                  {it._error && <div className="badge badge-warn">!</div>}
                  {!it.final && !it._error && <div className="badge badge-pending">○</div>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {selected && (
        <>
          <div className="spacer" />
          <div className="row" style={{ alignItems: "flex-start" }}>
            <div className="col" style={{ maxWidth: 340 }}>
              <img className="preview-img" src={selected.objectUrl} alt={selected.name} />
              <div className="filename">
                {selected.name}
                {selected.edited && <span className="edited-badge">✏ Edited</span>}
              </div>
            </div>

            <div className="col">
              <div className="section-title">
                Classification Result
                {selected.edited && <span className="edited-badge" style={{ marginLeft: 8 }}>✏ Manually Edited</span>}
              </div>

              {selected._error && (
                <div className="err-box">⚠ {selected._error}</div>
              )}

              {!finalData && !selected._error && (
                <div className="muted-box">Not processed yet. Click Process Next or Process All.</div>
              )}

              {finalData && (
                <div className="panel">
                  <div className="kv-wrap">
                    <KVRow label="Category" value={finalData.category} />
                    <KVRow label="Subcategory" value={finalData.subcategory} />
                    <KVRow label="Colour" value={finalData.colour} />
                    <KVRow label="Pattern" value={finalData.pattern} />
                    <KVRow label="Fit" value={finalData.fit} />
                  </div>
                </div>
              )}

              {finalData && (
                <>
                  <div className="section-title" style={{ marginTop: 4 }}>Features</div>
                  <div className="panel">
                    <FeatureChips features={finalData.features} />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="divider" />

          <div className="edit-section panel">
            <div className="section-title">✏ Edit Classification</div>
            <div style={{ color: "var(--muted)", fontSize: ".83rem", marginBottom: 16, lineHeight: 1.5 }}>
              Adjust any field below and click Save. Edited results will be used in the export.
            </div>
            <div className="edit-grid">
              <SelectField label="Category" value={editFields.category} choices={taxonomy.categories} onChange={setEditCat} />
              <SelectField label="Subcategory" value={editFields.subcategory} choices={taxonomy.subcategories} onChange={setEditSubcat} />
              <SelectField label="Colour" value={editFields.colour} choices={taxonomy.colours} onChange={setEditColour} />
              <SelectField label="Pattern" value={editFields.pattern} choices={taxonomy.patterns} onChange={setEditPattern} />
              <SelectField label="Fit" value={editFields.fit} choices={taxonomy.fits} onChange={setEditFit} />
            </div>
            <div style={{ marginTop: 14 }}>
              <CheckboxGroup
                label="Features"
                value={editFields.features}
                choices={taxonomy.features}
                onChange={setEditFeatures}
              />
            </div>
            <div className="save-bar" style={{ marginTop: 16 }}>
              <button className="btn btn-success" onClick={handleSaveEdit}>
                ✓ Save Edited Classification
              </button>
              {editSaved && (
                <div className="ok-box" style={{ padding: "7px 14px", fontSize: ".83rem" }}>
                  ✓ Saved successfully
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {items.length > 0 && successCount > 0 && (
        <>
          <div className="divider" />
          <div className="export-section">
            <div className="export-card">
              <div className="export-title">📤 Export Results</div>
              <div className="export-desc">
                {successCount} image(s) ready to export.
                Download the JSON file locally, push all results to the Strapi database, or do both at once.
                Manually edited results will be marked in the export.
              </div>
              <div className="export-btns">
                <button className="btn btn-success" onClick={handleDownloadJSON} disabled={loading}>
                  ⬇ Download JSON
                </button>
                <button className="btn btn-export" onClick={handleExportToStrapi} disabled={loading}>
                  ☁ Push to Strapi
                </button>
                <button className="btn btn-export" onClick={handleExportBoth} disabled={loading}>
                  ⬇ ☁ Download + Push to Strapi
                </button>
              </div>
              {strapiStatus && (
                <div className={`strapi-status ${strapiStatus.type === "ok" ? "ok-box" : "err-box"}`} style={{ marginTop: 14 }}>
                  {strapiStatus.text}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}