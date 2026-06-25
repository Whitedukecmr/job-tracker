import { useState, useMemo, useEffect, useRef } from "react";

const GIST_ID = "be8808b7e6b77f4b4a0c7a2f472a61c9";
const GIST_FILENAME = "candidatures.json";
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

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

async function loadFromGist() {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
  const data = await res.json();
  const content = data.files?.[GIST_FILENAME]?.content;
  if (!content) return null;
  const parsed = JSON.parse(content);
  return parsed.length > 0 ? parsed : null;
}
async function saveToGist(rows) {
  await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: { Authorization: `token ${GITHUB_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ files: { [GIST_FILENAME]: { content: JSON.stringify(rows, null, 2) } } }),
  });
}

function CounterCard({ label, value, accent }) {
  return (
    <div style={{ background:"#fff", border:`1.5px solid ${accent}40`, borderRadius:12, padding:"14px 20px", minWidth:100, flex:1, textAlign:"center", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize:28, fontWeight:800, color:accent, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, color:"#64748B", marginTop:4, fontWeight:500, letterSpacing:"0.04em", textTransform:"uppercase" }}>{label}</div>
    </div>
  );
}

function LockModal({ onSuccess, onClose }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);
  const submit = () => {
    if (pwd === ADMIN_PASSWORD) { onSuccess(); }
    else { setError(true); setPwd(""); setTimeout(() => setError(false), 2000); }
  };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:32, width:320, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ fontSize:32, textAlign:"center", marginBottom:12 }}>🔐</div>
        <h2 style={{ margin:"0 0 8px", textAlign:"center", color:"#0F2A5A", fontSize:18 }}>Mode Administrateur</h2>
        <p style={{ margin:"0 0 20px", textAlign:"center", color:"#64748B", fontSize:13 }}>Entrez le mot de passe pour modifier les données</p>
        <input
          type="password" value={pwd} onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="Mot de passe..."
          autoFocus
          style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:8, border:`2px solid ${error?"#EF4444":"#CBD5E1"}`, fontSize:14, outline:"none", fontFamily:"Arial", marginBottom:8, transition:"border 0.2s" }}
        />
        {error && <p style={{ color:"#EF4444", fontSize:12, margin:"0 0 8px", textAlign:"center" }}>Mot de passe incorrect</p>}
        <div style={{ display:"flex", gap:8, marginTop:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px", borderRadius:8, border:"1px solid #CBD5E1", background:"#F1F5F9", cursor:"pointer", fontFamily:"Arial", fontSize:13, fontWeight:600 }}>Annuler</button>
          <button onClick={submit} style={{ flex:1, padding:"10px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#0F2A5A,#0284C7)", color:"#fff", cursor:"pointer", fontFamily:"Arial", fontSize:13, fontWeight:700 }}>Connexion</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [rows, setRows] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLock, setShowLock] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [filterType, setFilterType] = useState("Toutes");
  const [editingNotes, setEditingNotes] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(newRow());
  const saveTimer = useRef(null);

  useEffect(() => {
    loadFromGist().then(data => {
      if (data) { nextId = Math.max(...data.map(r => r.id), 4) + 1; setRows(data); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const saveRows = (newRows) => {
    if (!isAdmin) return;
    setRows(newRows);
    setSaveStatus("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveToGist(newRows).then(() => setSaveStatus("saved")).catch(() => setSaveStatus("error"));
    }, 1500);
  };

  const filtered = useMemo(() => rows.filter(r => {
    const q = search.toLowerCase();
    return (!q || [r.company,r.role,r.type,r.notes].join(" ").toLowerCase().includes(q)) &&
      (filterStatus === "Tous" || r.status === filterStatus) &&
      (filterType === "Toutes" || r.type === filterType);
  }), [rows, search, filterStatus, filterType]);

  const counts = useMemo(() => ({
    total: rows.length,
    envoyee: rows.filter(r => ["Envoyée","Relance faite"].includes(r.status)).length,
    entretien: rows.filter(r => r.status === "Entretien").length,
    attente: rows.filter(r => r.status === "À envoyer").length,
    refus: rows.filter(r => r.status === "Refus").length,
  }), [rows]);

  const update = (id, field, value) => { if (isAdmin) saveRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r)); };
  const deleteRow = id => { if (isAdmin) saveRows(rows.filter(r => r.id !== id)); };
  const addRow = () => { if (isAdmin) { saveRows([...rows, { ...form }]); setForm(newRow()); setShowAddForm(false); } };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `candidatures_${new Date().toISOString().slice(0,10)}.json`; a.click();
  };
  const importJSON = e => {
    if (!isAdmin) return;
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { try { saveRows(JSON.parse(ev.target.result)); } catch { alert("JSON invalide"); } };
    reader.readAsText(file); e.target.value = "";
  };

  const inp = (extra={}) => ({ fontFamily:"Arial,sans-serif", fontSize:13, border:"1px solid #CBD5E1", borderRadius:6, padding:"6px 10px", outline:"none", color:"#1E293B", background:"#fff", ...extra });
  const th = { padding:"12px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.06em", background:"#F8FAFC", borderBottom:"1.5px solid #E2E8F0", whiteSpace:"nowrap" };
  const td = { padding:"10px 14px", fontSize:13, color:"#1E293B", borderBottom:"1px solid #F1F5F9", verticalAlign:"middle" };
  const saveLabel = { idle:"", saving:"⏳ Sauvegarde...", saved:"✓ Sauvegardé", error:"⚠ Erreur" };
  const saveColor = { idle:"#CBD5E1", saving:"#F97316", saved:"#10B981", error:"#EF4444" };

  if (loading) return (
    <div style={{ fontFamily:"Arial", display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#F0F4FA", flexDirection:"column", gap:16 }}>
      <div style={{ fontSize:32 }}>📋</div>
      <div style={{ fontSize:16, color:"#0F2A5A", fontWeight:700 }}>Chargement des candidatures...</div>
    </div>
  );

  return (
    <div style={{ fontFamily:"Arial,sans-serif", background:"#F0F4FA", minHeight:"100vh", padding:"28px 20px" }}>
      {showLock && <LockModal onSuccess={() => { setIsAdmin(true); setShowLock(false); }} onClose={() => setShowLock(false)} />}

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:"linear-gradient(135deg,#0F2A5A,#00B4D8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>📋</div>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:"#0F2A5A", letterSpacing:"-0.02em" }}>Tracker Candidatures</h1>
            <p style={{ margin:0, fontSize:12, color:"#64748B" }}>Fred EPESSE PRISO — {new Date().toLocaleDateString("fr-FR")}</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {isAdmin && <span style={{ fontSize:11, color:saveColor[saveStatus], fontWeight:600, minWidth:130 }}>{saveLabel[saveStatus]}</span>}
          {/* Badge mode */}
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:20, background:isAdmin?"#ECFDF5":"#FFF7ED", border:`1px solid ${isAdmin?"#10B98140":"#F9731640"}` }}>
            <span style={{ fontSize:14 }}>{isAdmin ? "✏️" : "👁"}</span>
            <span style={{ fontSize:12, fontWeight:700, color:isAdmin?"#10B981":"#F97316" }}>{isAdmin ? "Mode Admin" : "Lecture seule"}</span>
          </div>
          <button onClick={() => isAdmin ? setIsAdmin(false) : setShowLock(true)}
            style={{ padding:"7px 14px", borderRadius:8, border:"none", background:isAdmin?"#FEF2F2":"linear-gradient(135deg,#0F2A5A,#0284C7)", color:isAdmin?"#EF4444":"#fff", cursor:"pointer", fontFamily:"Arial", fontSize:12, fontWeight:700 }}>
            {isAdmin ? "🔓 Déconnexion" : "🔐 Admin"}
          </button>
          {isAdmin && <>
            <button onClick={exportJSON} style={{ ...inp({ padding:"7px 14px", cursor:"pointer", background:"#F1F5F9", border:"1px solid #CBD5E1", fontWeight:600, fontSize:12 }) }}>⬇ Export</button>
            <label style={{ ...inp({ padding:"7px 14px", cursor:"pointer", background:"#F1F5F9", border:"1px solid #CBD5E1", fontWeight:600, fontSize:12, display:"inline-block" }) }}>
              ⬆ Import<input type="file" accept=".json" onChange={importJSON} style={{ display:"none" }} />
            </label>
          </>}
        </div>
      </div>

      {/* Counters */}
      <div style={{ display:"flex", gap:10, marginBottom:24, flexWrap:"wrap" }}>
        <CounterCard label="Total" value={counts.total} accent="#0F2A5A" />
        <CounterCard label="Envoyées" value={counts.envoyee} accent="#F97316" />
        <CounterCard label="Entretiens" value={counts.entretien} accent="#10B981" />
        <CounterCard label="En attente" value={counts.attente} accent="#3B82F6" />
        <CounterCard label="Refus" value={counts.refus} accent="#EF4444" />
      </div>

      {/* Filters */}
      <div style={{ background:"#fff", borderRadius:12, padding:"14px 16px", marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
        <input placeholder="🔍  Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} style={{ ...inp({ width:200, borderRadius:8 }) }} />
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ ...inp({ width:160, cursor:"pointer", borderRadius:8 }) }}>
          {STATUS_LIST.map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{ ...inp({ width:160, cursor:"pointer", borderRadius:8 }) }}>
          {COMPANY_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
        {isAdmin && (
          <button onClick={()=>{ setShowAddForm(!showAddForm); setForm(newRow()); }}
            style={{ marginLeft:"auto", background:showAddForm?"#E2E8F0":"linear-gradient(135deg,#0F2A5A,#0284C7)", color:showAddForm?"#1E293B":"#fff", border:"none", borderRadius:8, padding:"8px 18px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"Arial" }}>
            {showAddForm ? "✕ Annuler" : "+ Ajouter"}
          </button>
        )}
      </div>

      {/* Add form */}
      {isAdmin && showAddForm && (
        <div style={{ background:"#fff", borderRadius:12, padding:16, marginBottom:16, boxShadow:"0 2px 8px rgba(0,180,216,.12)", border:"1.5px solid #00B4D840" }}>
          <div style={{ fontWeight:700, color:"#0F2A5A", fontSize:13, marginBottom:12 }}>Nouvelle candidature</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {[["Entreprise","company"],["Poste","role"],["Date envoi","sentDate"],["Date relance","followUpDate"],["Notes","notes"]].map(([label,field])=>(
              <div key={field} style={{ flex:"1 1 150px" }}>
                <div style={{ fontSize:11, color:"#64748B", fontWeight:600, marginBottom:4 }}>{label}</div>
                <input placeholder={label} value={form[field]} onChange={e=>setForm(p=>({...p,[field]:e.target.value}))} style={{ ...inp({ width:"100%", boxSizing:"border-box" }) }} />
              </div>
            ))}
            {[["Type","type",COMPANY_TYPES.filter(t=>t!=="Toutes")],["Statut","status",Object.keys(STATUS_CONFIG)]].map(([label,field,opts])=>(
              <div key={field} style={{ flex:"1 1 130px" }}>
                <div style={{ fontSize:11, color:"#64748B", fontWeight:600, marginBottom:4 }}>{label}</div>
                <select value={form[field]} onChange={e=>setForm(p=>({...p,[field]:e.target.value}))} style={{ ...inp({ width:"100%", cursor:"pointer", boxSizing:"border-box" }) }}>
                  {opts.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button onClick={addRow} disabled={!form.company||!form.role}
            style={{ marginTop:12, background:(!form.company||!form.role)?"#CBD5E1":"linear-gradient(135deg,#0F2A5A,#0284C7)", color:"#fff", border:"none", borderRadius:8, padding:"9px 20px", fontSize:13, fontWeight:700, cursor:(!form.company||!form.role)?"not-allowed":"pointer", fontFamily:"Arial" }}>
            Enregistrer
          </button>
        </div>
      )}

      {/* Bannière lecture seule */}
      {!isAdmin && (
        <div style={{ background:"#FFF7ED", border:"1px solid #F9731630", borderRadius:10, padding:"10px 16px", marginBottom:16, fontSize:13, color:"#92400E", display:"flex", alignItems:"center", gap:8 }}>
          👁 <span>Mode lecture seule — cliquez sur <strong>🔐 Admin</strong> pour modifier les données.</span>
        </div>
      )}

      {/* Table */}
      <div style={{ background:"#fff", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:780 }}>
            <thead><tr>{["Entreprise","Type","Poste","Statut","Date envoi","Date relance","Notes", isAdmin?"":""].map((h,i)=><th key={i} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length===0 && <tr><td colSpan={8} style={{ ...td, textAlign:"center", color:"#94A3B8", padding:32 }}>Aucune candidature trouvée</td></tr>}
              {filtered.map((row,i)=>(
                <tr key={row.id} style={{ background:i%2===0?"#fff":"#FAFBFF" }}>
                  <td style={{ ...td, minWidth:140 }}>
                    {isAdmin
                      ? <input value={row.company} onChange={e=>update(row.id,"company",e.target.value)}
                          style={{ fontFamily:"Arial",fontSize:13,fontWeight:700,color:"#0F2A5A",background:"transparent",border:"1px solid transparent",borderRadius:5,padding:"3px 6px",width:"100%",outline:"none" }}
                          onFocus={e=>e.target.style.border="1px solid #CBD5E1"} onBlur={e=>e.target.style.border="1px solid transparent"} />
                      : <span style={{ fontWeight:700, color:"#0F2A5A" }}>{row.company}</span>
                    }
                  </td>
                  <td style={{ ...td, minWidth:110 }}>
                    {isAdmin
                      ? <select value={row.type} onChange={e=>update(row.id,"type",e.target.value)}
                          style={{ fontFamily:"Arial",fontSize:13,background:"transparent",border:"1px solid transparent",cursor:"pointer",borderRadius:5,padding:"3px 6px",outline:"none",color:"#1E293B" }}
                          onFocus={e=>e.target.style.border="1px solid #CBD5E1"} onBlur={e=>e.target.style.border="1px solid transparent"}>
                          {COMPANY_TYPES.filter(t=>t!=="Toutes").map(t=><option key={t}>{t}</option>)}
                        </select>
                      : <span>{row.type}</span>
                    }
                  </td>
                  <td style={{ ...td, minWidth:180 }}>
                    {isAdmin
                      ? <input value={row.role} onChange={e=>update(row.id,"role",e.target.value)}
                          style={{ fontFamily:"Arial",fontSize:13,background:"transparent",border:"1px solid transparent",borderRadius:5,padding:"3px 6px",width:"100%",outline:"none",color:"#1E293B" }}
                          onFocus={e=>e.target.style.border="1px solid #CBD5E1"} onBlur={e=>e.target.style.border="1px solid transparent"} />
                      : <span>{row.role}</span>
                    }
                  </td>
                  <td style={{ ...td, minWidth:145 }}>
                    {isAdmin
                      ? <select value={row.status} onChange={e=>update(row.id,"status",e.target.value)}
                          style={{ fontFamily:"Arial",fontSize:12,fontWeight:600,border:`1.5px solid ${STATUS_CONFIG[row.status]?.color}50`,borderRadius:20,padding:"4px 10px",color:STATUS_CONFIG[row.status]?.color,background:STATUS_CONFIG[row.status]?.bg,cursor:"pointer",outline:"none" }}>
                          {Object.keys(STATUS_CONFIG).map(s=><option key={s}>{s}</option>)}
                        </select>
                      : <span style={{ display:"inline-block",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,color:STATUS_CONFIG[row.status]?.color,background:STATUS_CONFIG[row.status]?.bg,border:`1px solid ${STATUS_CONFIG[row.status]?.color}30` }}>{row.status}</span>
                    }
                  </td>
                  {["sentDate","followUpDate"].map(field=>(
                    <td key={field} style={{ ...td, minWidth:110 }}>
                      {isAdmin
                        ? <input placeholder="jj/mm/aaaa" value={row[field]} onChange={e=>update(row.id,field,e.target.value)}
                            style={{ fontFamily:"Arial",fontSize:12,background:"transparent",border:"1px solid transparent",borderRadius:5,padding:"3px 6px",width:90,outline:"none",color:"#1E293B" }}
                            onFocus={e=>e.target.style.border="1px solid #CBD5E1"} onBlur={e=>e.target.style.border="1px solid transparent"} />
                        : <span style={{ fontSize:12, color:"#64748B" }}>{row[field] || "—"}</span>
                      }
                    </td>
                  ))}
                  <td style={{ ...td, minWidth:160 }}>
                    {isAdmin
                      ? editingNotes===row.id
                        ? <textarea autoFocus value={row.notes} onChange={e=>update(row.id,"notes",e.target.value)} onBlur={()=>setEditingNotes(null)}
                            style={{ fontFamily:"Arial",fontSize:12,border:"1px solid #00B4D8",borderRadius:6,padding:"4px 8px",width:"100%",minHeight:56,resize:"vertical",outline:"none" }} />
                        : <div onClick={()=>setEditingNotes(row.id)} style={{ fontSize:12,color:row.notes?"#1E293B":"#CBD5E1",cursor:"pointer",minHeight:22,padding:"2px 4px",borderRadius:4 }}>
                            {row.notes||"Ajouter une note..."}
                          </div>
                      : <span style={{ fontSize:12, color:"#64748B" }}>{row.notes || "—"}</span>
                    }
                  </td>
                  {isAdmin && (
                    <td style={{ ...td, textAlign:"center", minWidth:40 }}>
                      <button onClick={()=>deleteRow(row.id)} title="Supprimer"
                        style={{ background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#CBD5E1",padding:4,borderRadius:6,lineHeight:1 }}
                        onMouseEnter={e=>e.target.style.color="#EF4444"} onMouseLeave={e=>e.target.style.color="#CBD5E1"}>✕</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:"10px 16px",borderTop:"1px solid #F1F5F9",fontSize:11,color:"#94A3B8",display:"flex",justifyContent:"space-between" }}>
          <span>{filtered.length} résultat{filtered.length>1?"s":""} affiché{filtered.length>1?"s":""}</span>
          <span>💾 Données sauvegardées sur GitHub Gist</span>
        </div>
      </div>
    </div>
  );
}
