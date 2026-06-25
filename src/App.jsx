import { useState, useMemo, useEffect } from "react";

const STATUS_CONFIG = {
  "À envoyer":     { color: "#3B82F6", bg: "#EFF6FF" },
  "Envoyée":       { color: "#F97316", bg: "#FFF7ED" },
  "Relance faite": { color: "#8B5CF6", bg: "#F5F3FF" },
  "Entretien":     { color: "#10B981", bg: "#ECFDF5" },
  "Refus":         { color: "#EF4444", bg: "#FEF2F2" },
};

const COMPANY_TYPES = ["Toutes", "ESN", "Éditeur cloud", "Grand compte", "Startup", "Autre"];
const STATUS_LIST = ["Tous", ...Object.keys(STATUS_CONFIG)];

const initialData = [
  { id: 1, company: "Neurones / SIZING", type: "ESN", role: "Ingénieur de Production DevOps", status: "Envoyée", sentDate: "24/06/2026", followUpDate: "", notes: "" },
  { id: 2, company: "OVHcloud", type: "Éditeur cloud", role: "Ingénieur Production / Cloud Ops", status: "À envoyer", sentDate: "", followUpDate: "", notes: "" },
  { id: 3, company: "Devoteam", type: "ESN", role: "Ingénieur de Production / SysOps", status: "À envoyer", sentDate: "", followUpDate: "", notes: "" },
  { id: 4, company: "Société Générale", type: "Grand compte", role: "Ingénieur Infrastructure / SysOps", status: "À envoyer", sentDate: "", followUpDate: "", notes: "" },
];

let nextId = 5;
const newRow = () => ({ id: nextId++, company: "", type: "ESN", role: "", status: "À envoyer", sentDate: "", followUpDate: "", notes: "" });

function CounterCard({ label, value, accent }) {
  return (
    <div style={{ background: "#fff", border: `1.5px solid ${accent}40`, borderRadius: 12, padding: "14px 20px", minWidth: 100, flex: 1, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: accent, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

export default function App() {
  const [rows, setRows] = useState(() => {
    try {
      const saved = localStorage.getItem("job-tracker-data");
      if (saved) {
        const parsed = JSON.parse(saved);
        nextId = Math.max(...parsed.map(r => r.id), 4) + 1;
        return parsed;
      }
    } catch {}
    return initialData;
  });

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [filterType, setFilterType] = useState("Toutes");
  const [editingNotes, setEditingNotes] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(newRow());
  const [saveFlash, setSaveFlash] = useState(false);

  useEffect(() => {
    localStorage.setItem("job-tracker-data", JSON.stringify(rows));
    setSaveFlash(true);
    const t = setTimeout(() => setSaveFlash(false), 1200);
    return () => clearTimeout(t);
  }, [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || [r.company, r.role, r.type, r.notes].join(" ").toLowerCase().includes(q);
    const matchStatus = filterStatus === "Tous" || r.status === filterStatus;
    const matchType = filterType === "Toutes" || r.type === filterType;
    return matchSearch && matchStatus && matchType;
  }), [rows, search, filterStatus, filterType]);

  const counts = useMemo(() => ({
    total: rows.length,
    envoyee: rows.filter(r => ["Envoyée", "Relance faite"].includes(r.status)).length,
    entretien: rows.filter(r => r.status === "Entretien").length,
    attente: rows.filter(r => r.status === "À envoyer").length,
    refus: rows.filter(r => r.status === "Refus").length,
  }), [rows]);

  const update = (id, field, value) => setRows(p => p.map(r => r.id === id ? { ...r, [field]: value } : r));
  const deleteRow = id => setRows(p => p.filter(r => r.id !== id));
  const addRow = () => { setRows(p => [...p, { ...form }]); setForm(newRow()); setShowAddForm(false); };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `candidatures_${new Date().toISOString().slice(0,10)}.json`; a.click();
  };

  const importJSON = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { try { const data = JSON.parse(ev.target.result); setRows(data); } catch { alert("Fichier JSON invalide"); } };
    reader.readAsText(file);
    e.target.value = "";
  };

  const inp = (extra = {}) => ({
    fontFamily: "Arial, sans-serif", fontSize: 13, border: "1px solid #CBD5E1",
    borderRadius: 6, padding: "6px 10px", outline: "none", color: "#1E293B", background: "#fff", ...extra
  });

  const th = { padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", background: "#F8FAFC", borderBottom: "1.5px solid #E2E8F0", whiteSpace: "nowrap" };
  const td = { padding: "10px 14px", fontSize: 13, color: "#1E293B", borderBottom: "1px solid #F1F5F9", verticalAlign: "middle" };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: "#F0F4FA", minHeight: "100vh", padding: "28px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#0F2A5A,#00B4D8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📋</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0F2A5A", letterSpacing: "-0.02em" }}>Tracker Candidatures</h1>
            <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>Fred EPESSE PRISO — {new Date().toLocaleDateString("fr-FR")}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: saveFlash ? "#10B981" : "#CBD5E1", transition: "color 0.3s", fontWeight: 600 }}>✓ Sauvegardé</span>
          <button onClick={exportJSON} style={{ ...inp({ padding: "7px 14px", cursor: "pointer", background: "#F1F5F9", border: "1px solid #CBD5E1", fontWeight: 600, fontSize: 12 }) }}>⬇ Export JSON</button>
          <label style={{ ...inp({ padding: "7px 14px", cursor: "pointer", background: "#F1F5F9", border: "1px solid #CBD5E1", fontWeight: 600, fontSize: 12, display: "inline-block" }) }}>
            ⬆ Import JSON<input type="file" accept=".json" onChange={importJSON} style={{ display: "none" }} />
          </label>
        </div>
      </div>

      {/* Counters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <CounterCard label="Total" value={counts.total} accent="#0F2A5A" />
        <CounterCard label="Envoyées" value={counts.envoyee} accent="#F97316" />
        <CounterCard label="Entretiens" value={counts.entretien} accent="#10B981" />
        <CounterCard label="En attente" value={counts.attente} accent="#3B82F6" />
        <CounterCard label="Refus" value={counts.refus} accent="#EF4444" />
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="🔍  Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp({ width: 200, borderRadius: 8 }) }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp({ width: 160, cursor: "pointer", borderRadius: 8 }) }}>
          {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...inp({ width: 160, cursor: "pointer", borderRadius: 8 }) }}>
          {COMPANY_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <button onClick={() => { setShowAddForm(!showAddForm); setForm(newRow()); }}
          style={{ marginLeft: "auto", background: showAddForm ? "#E2E8F0" : "linear-gradient(135deg,#0F2A5A,#0284C7)", color: showAddForm ? "#1E293B" : "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Arial" }}>
          {showAddForm ? "✕ Annuler" : "+ Ajouter"}
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,180,216,.12)", border: "1.5px solid #00B4D840" }}>
          <div style={{ fontWeight: 700, color: "#0F2A5A", fontSize: 13, marginBottom: 12 }}>Nouvelle candidature</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[["Entreprise","company"],["Poste","role"],["Date envoi","sentDate"],["Date relance","followUpDate"],["Notes","notes"]].map(([label, field]) => (
              <div key={field} style={{ flex: "1 1 150px" }}>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginBottom: 4 }}>{label}</div>
                <input placeholder={label} value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} style={{ ...inp({ width: "100%", boxSizing: "border-box" }) }} />
              </div>
            ))}
            {[["Type","type",COMPANY_TYPES.filter(t=>t!=="Toutes")],["Statut","status",Object.keys(STATUS_CONFIG)]].map(([label, field, opts]) => (
              <div key={field} style={{ flex: "1 1 130px" }}>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginBottom: 4 }}>{label}</div>
                <select value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} style={{ ...inp({ width: "100%", cursor: "pointer", boxSizing: "border-box" }) }}>
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button onClick={addRow} disabled={!form.company || !form.role}
            style={{ marginTop: 12, background: (!form.company||!form.role) ? "#CBD5E1" : "linear-gradient(135deg,#0F2A5A,#0284C7)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: (!form.company||!form.role) ? "not-allowed" : "pointer", fontFamily: "Arial" }}>
            Enregistrer
          </button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
            <thead>
              <tr>{["Entreprise","Type","Poste","Statut","Date envoi","Date relance","Notes",""].map(h => <th key={h} style={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} style={{ ...td, textAlign: "center", color: "#94A3B8", padding: 32 }}>Aucune candidature trouvée</td></tr>}
              {filtered.map((row, i) => (
                <tr key={row.id} style={{ background: i%2===0?"#fff":"#FAFBFF" }}>
                  <td style={{ ...td, minWidth: 140 }}>
                    <input value={row.company} onChange={e => update(row.id,"company",e.target.value)}
                      style={{ fontFamily:"Arial",fontSize:13,fontWeight:700,color:"#0F2A5A",background:"transparent",border:"1px solid transparent",borderRadius:5,padding:"3px 6px",width:"100%",outline:"none" }}
                      onFocus={e=>e.target.style.border="1px solid #CBD5E1"} onBlur={e=>e.target.style.border="1px solid transparent"} />
                  </td>
                  <td style={{ ...td, minWidth: 110 }}>
                    <select value={row.type} onChange={e => update(row.id,"type",e.target.value)}
                      style={{ fontFamily:"Arial",fontSize:13,background:"transparent",border:"1px solid transparent",cursor:"pointer",borderRadius:5,padding:"3px 6px",outline:"none",color:"#1E293B" }}
                      onFocus={e=>e.target.style.border="1px solid #CBD5E1"} onBlur={e=>e.target.style.border="1px solid transparent"}>
                      {COMPANY_TYPES.filter(t=>t!=="Toutes").map(t=><option key={t}>{t}</option>)}
                    </select>
                  </td>
                  <td style={{ ...td, minWidth: 180 }}>
                    <input value={row.role} onChange={e => update(row.id,"role",e.target.value)}
                      style={{ fontFamily:"Arial",fontSize:13,background:"transparent",border:"1px solid transparent",borderRadius:5,padding:"3px 6px",width:"100%",outline:"none",color:"#1E293B" }}
                      onFocus={e=>e.target.style.border="1px solid #CBD5E1"} onBlur={e=>e.target.style.border="1px solid transparent"} />
                  </td>
                  <td style={{ ...td, minWidth: 145 }}>
                    <select value={row.status} onChange={e => update(row.id,"status",e.target.value)}
                      style={{ fontFamily:"Arial",fontSize:12,fontWeight:600,border:`1.5px solid ${STATUS_CONFIG[row.status]?.color}50`,borderRadius:20,padding:"4px 10px",color:STATUS_CONFIG[row.status]?.color,background:STATUS_CONFIG[row.status]?.bg,cursor:"pointer",outline:"none" }}>
                      {Object.keys(STATUS_CONFIG).map(s=><option key={s}>{s}</option>)}
                    </select>
                  </td>
                  {["sentDate","followUpDate"].map(field => (
                    <td key={field} style={{ ...td, minWidth: 110 }}>
                      <input placeholder="jj/mm/aaaa" value={row[field]} onChange={e => update(row.id,field,e.target.value)}
                        style={{ fontFamily:"Arial",fontSize:12,background:"transparent",border:"1px solid transparent",borderRadius:5,padding:"3px 6px",width:90,outline:"none",color:"#1E293B" }}
                        onFocus={e=>e.target.style.border="1px solid #CBD5E1"} onBlur={e=>e.target.style.border="1px solid transparent"} />
                    </td>
                  ))}
                  <td style={{ ...td, minWidth: 160 }}>
                    {editingNotes===row.id
                      ? <textarea autoFocus value={row.notes} onChange={e=>update(row.id,"notes",e.target.value)} onBlur={()=>setEditingNotes(null)}
                          style={{ fontFamily:"Arial",fontSize:12,border:"1px solid #00B4D8",borderRadius:6,padding:"4px 8px",width:"100%",minHeight:56,resize:"vertical",outline:"none" }} />
                      : <div onClick={()=>setEditingNotes(row.id)} style={{ fontSize:12,color:row.notes?"#1E293B":"#CBD5E1",cursor:"pointer",minHeight:22,padding:"2px 4px",borderRadius:4 }} title="Cliquer pour éditer">
                          {row.notes||"Ajouter une note..."}
                        </div>
                    }
                  </td>
                  <td style={{ ...td, textAlign:"center", minWidth:40 }}>
                    <button onClick={()=>deleteRow(row.id)} title="Supprimer"
                      style={{ background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#CBD5E1",padding:4,borderRadius:6,lineHeight:1 }}
                      onMouseEnter={e=>e.target.style.color="#EF4444"} onMouseLeave={e=>e.target.style.color="#CBD5E1"}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:"10px 16px",borderTop:"1px solid #F1F5F9",fontSize:11,color:"#94A3B8",display:"flex",justifyContent:"space-between" }}>
          <span>{filtered.length} résultat{filtered.length>1?"s":""} affiché{filtered.length>1?"s":""}</span>
          <span>Données sauvegardées automatiquement dans le navigateur</span>
        </div>
      </div>
    </div>
  );
}
