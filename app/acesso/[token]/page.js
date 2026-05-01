"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BrandHeader from "../../../components/BrandHeader";
import { sections } from "../../../lib/formSchema";

function cleanCPF(value) { return (value || "").replace(/\D/g, ""); }
function formatCPF(value) {
  const digits = cleanCPF(value).slice(0, 11);
  return digits.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function formatDateBR(value) {
  const digits = (value || "").replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{2})(\d)/, "$1/$2").replace(/(\d{2})(\d)/, "$1/$2");
}
function brDateToISO(value) {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.length !== 8) return "";
  return `${digits.slice(4,8)}-${digits.slice(2,4)}-${digits.slice(0,2)}`;
}

export default function ClientAccessPage() {
  const params = useParams();
  const token = params?.token;
  const [client, setClient] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submittedAt, setSubmittedAt] = useState(null);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(true);
  const [cpf, setCpf] = useState("");
  const [birthDateBR, setBirthDateBR] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => { setNeedsVerification(true); setLoading(false); }, [token]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/client/${token}`, { method:"GET", cache:"no-store" });
    const data = await res.json();
    if (res.status === 401 && data.needs_verification) { setNeedsVerification(true); setLoading(false); return; }
    if (!res.ok) { alert(data.error || "Link inválido."); setLoading(false); return; }
    setNeedsVerification(false); setClient(data.client); setAnswers(data.response?.answers || {}); setSubmittedAt(data.response?.submitted_at || null); setLoading(false);
  }

  async function verifyIdentity() {
    setVerificationError("");
    const cleanedCPF = cleanCPF(cpf);
    const isoDate = brDateToISO(birthDateBR);
    if (cleanedCPF.length !== 11) return setVerificationError("Informe um CPF com 11 números.");
    if (!isoDate) return setVerificationError("Informe a data de nascimento no formato DD/MM/AAAA.");
    setVerifying(true);
    try {
      const res = await fetch(`/api/client/${token}/verify`, { method:"POST", headers:{"Content-Type":"application/json"}, cache:"no-store", body:JSON.stringify({ cpf: cleanedCPF, birth_date: isoDate }) });
      const data = await res.json();
      if (!res.ok) return setVerificationError(data.error || "Não foi possível confirmar seus dados.");
      setNeedsVerification(false); setClient(null); setAnswers({}); await load();
    } catch (error) {
      setVerificationError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally { setVerifying(false); }
  }

  async function save(nextAnswers = answers, showAlert = false) {
    if (client?.is_locked || submittedAt) { setSaveStatus("Formulário já enviado e bloqueado."); return false; }
    setSaveStatus("Salvando...");
    const res = await fetch(`/api/client/${token}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ answers: nextAnswers }) });
    const data = await res.json();
    if (res.status === 401 && data.needs_verification) { setNeedsVerification(true); setSaveStatus(""); return false; }
    if (!res.ok) { setSaveStatus("Erro ao salvar. Tente novamente."); if (showAlert) alert(data.error || "Erro ao salvar."); return false; }
    setSaveStatus("Salvo automaticamente"); if (showAlert) alert("Informações salvas com sucesso."); return true;
  }

  function setValue(fieldId, value) { const nextAnswers = { ...answers, [fieldId]: value }; setAnswers(nextAnswers); save(nextAnswers, false); }

  async function submitForm() {
    if (!confirm("Confirmar envio? Depois disso o formulário ficará bloqueado.")) return;
    const saved = await save(answers, false); if (!saved) return;
    const res = await fetch(`/api/client/${token}/submit`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ answers }) });
    const data = await res.json();
    if (res.status === 401 && data.needs_verification) { setNeedsVerification(true); return; }
    if (!res.ok) return alert(data.error || "Erro ao enviar.");
    window.location.reload();
  }

  if (loading) return <main style={{ padding: 30 }}>Carregando...</main>;

  if (needsVerification) {
    return (
      <main className="verify-page">
        <div className="verify-card card">
          <BrandHeader compact />
          <div className="verify-badge">Acesso seguro</div>
          <h2 className="verify-title">Confirme seus dados para continuar</h2>
          <p className="verify-text">Este link é exclusivo do solicitante. Para proteger suas informações, confirme o CPF e a data de nascimento vinculados a este atendimento.</p>
          <div className="verify-grid">
            <div className="field"><label>CPF</label><input value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" autoComplete="off" /></div>
            <div className="field"><label>Data de nascimento</label><input type="text" value={birthDateBR} onChange={(e) => setBirthDateBR(formatDateBR(e.target.value))} placeholder="DD/MM/AAAA" inputMode="numeric" autoComplete="off" maxLength={10} /></div>
          </div>
          {verificationError && <div className="error-alert" style={{ marginBottom: 14 }}>{verificationError}</div>}
          <button className="btn-primary" onClick={verifyIdentity} disabled={verifying} style={{ width:"100%" }}>{verifying ? "Verificando..." : "Confirmar acesso"}</button>
          <p className="verify-footnote">Se os dados não conferirem, solicite um novo link à Resumindo Viagens.</p>
        </div>
      </main>
    );
  }

  if (!client) return <main style={{ padding: 30 }}>Link inválido.</main>;
  if (client?.is_locked || submittedAt) return <PDFView client={client} answers={answers} />;

  const section = sections[current];
  return (
    <main style={{ maxWidth: 1200, margin:"0 auto", padding:24 }}>
      <div className="card" style={{ padding:22, marginBottom:22 }}><BrandHeader clientName={client?.name} /></div>
      <div className="no-print" style={{ display:"flex", justifyContent:"space-between", gap:16, alignItems:"center", marginBottom:20 }}>
        <div><small>{saveStatus}</small></div>
        <div style={{ display:"flex", gap:10 }}><button className="btn-light" onClick={() => save(answers, true)}>Salvar e continuar depois</button><button className="btn-primary" onClick={submitForm}>Enviar definitivamente (encerra preenchimento)</button></div>
      </div>
      <div className="form-layout" style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:24 }}>
        <aside className="card no-print" style={{ padding:14 }}>{sections.map((item, index) => <button key={item.title} onClick={() => setCurrent(index)} className={index === current ? "btn-primary" : "btn-light"} style={{ width:"100%", marginBottom:8, textAlign:"left" }}>{index+1}. {item.title.replace(/^\d+\. /, "")}</button>)}</aside>
        <section className="card" style={{ padding:28 }}>
          <h1 style={{ color:"var(--navy)" }}>{section.title}</h1>
          <div className="grid">{section.fields.map((field) => <Field key={field.id} field={field} value={answers[field.id]} onChange={setValue} />)}</div>
          <div className="no-print" style={{ display:"flex", justifyContent:"space-between", marginTop:22 }}><button className="btn-light" onClick={() => setCurrent(Math.max(0, current - 1))}>Voltar</button>{current < sections.length - 1 && <button className="btn-dark" onClick={() => setCurrent(Math.min(sections.length - 1, current + 1))}>Próxima</button>}</div>
        </section>
      </div>
    </main>
  );
}

function HelpIcon({ text }) {
  const message = text || "Balão explicativo editável futuramente.";
  return <span className="help" data-tip={message} title={message} tabIndex="0" aria-label={message} onClick={(event) => event.currentTarget.focus()}>?</span>;
}

function Field({ field, value, onChange }) {
  const className = field.full ? "field full" : (field.wide || field.type === "textarea" || field.type === "checkbox" ? "field wide" : "field");
  if (field.type === "select") return <div className={className}><label>{field.label}<HelpIcon text={field.help} /></label><select value={value || ""} onChange={(e) => onChange(field.id, e.target.value)}><option value="">Selecione</option>{field.options.map((o) => <option key={o}>{o}</option>)}</select></div>;
  if (field.type === "radio") return <div className={className}><label>{field.label}<HelpIcon text={field.help} /></label><div className="radio">{field.options.map((o) => <label key={o}><input type="radio" checked={value === o} onChange={() => onChange(field.id, o)} /> {o}</label>)}</div></div>;
  if (field.type === "textarea") return <div className={className}><label>{field.label}<HelpIcon text={field.help} /></label><textarea value={value || ""} onChange={(e) => onChange(field.id, e.target.value)} /></div>;
  if (field.type === "checkbox") return <div className={className}><label><input style={{ width:"auto" }} type="checkbox" checked={!!value} onChange={(e) => onChange(field.id, e.target.checked)} />{field.label}<HelpIcon text={field.help} /></label></div>;
  return <div className={className}><label>{field.label}<HelpIcon text={field.help} /></label><input type={field.type} value={value || ""} onChange={(e) => onChange(field.id, e.target.value)} /></div>;
}

function PDFView({ client, answers }) {
  return (
    <main style={{ maxWidth:980, margin:"30px auto", padding:24 }}>
      <div className="no-print" style={{ marginBottom:18 }}><button className="btn-primary" onClick={() => window.print()}>Baixar PDF das minhas respostas</button></div>
      <div className="card" style={{ padding:34 }}>
        <BrandHeader clientName={client?.name} />
        <h2 style={{ color:"var(--navy)", marginTop:28 }}>Respostas do formulário</h2>
        {sections.map((section) => <section key={section.title} style={{ breakInside:"avoid", marginTop:28 }}><h3 style={{ background:"var(--navy)", color:"#fff", padding:12, borderRadius:10 }}>{section.title}</h3><div className="grid">{section.fields.filter((field) => answers[field.id]).map((field) => <div key={field.id} className={field.wide || field.full ? "wide" : ""} style={{ border:"1px solid #E4E8F0", borderRadius:12, padding:12 }}><b style={{ color:"var(--navy)" }}>{field.label}</b><br/><span>{String(answers[field.id])}</span></div>)}</div></section>)}
        <div className="print-footer">Resumindo Viagens • contato@resumindoviagens.com.br • Instagram: @resumindoviagens</div>
      </div>
    </main>
  );
}
