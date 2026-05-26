"use client";
import { useEffect, useMemo, useState } from "react";

function dateOnly(value){ if(!value) return null; const d=new Date(String(value).slice(0,10)+"T00:00:00"); return Number.isFinite(d.getTime())?d:null; }
function daysUntil(value){ const d=dateOnly(value); if(!d) return null; const t=new Date(); const b=new Date(t.getFullYear(),t.getMonth(),t.getDate()); return Math.round((d-b)/86400000); }
function formatDateBR(value){ const d=dateOnly(value); return d?d.toLocaleDateString("pt-BR"):"-"; }
function birthdayToday(value){ const d=dateOnly(value); if(!d) return false; const t=new Date(); return d.getDate()===t.getDate() && d.getMonth()===t.getMonth(); }
function cleanPhone(v){ return String(v||"").replace(/\D/g,""); }

function messageFor(event){
  const name=event.client.name||"cliente";
  if(event.type==="birthday") return `Olá, ${name}.\n\nA Resumindo Viagens deseja um feliz aniversário, com muita saúde, felicidade e novas experiências inesquecíveis.\n\nEsperamos que este novo ciclo traga conquistas, viagens especiais e momentos marcantes ao lado das pessoas que você ama.\n\nConte sempre conosco.\n\nResumindo Viagens`;
  if(event.type==="passport") return `Olá, ${name}.\n\nIdentificamos que seu passaporte está próximo do vencimento ou já venceu.\n\nA Resumindo Viagens também auxilia no preenchimento, emissão da guia e agendamento para atendimento na Polícia Federal, facilitando essa etapa para você.\n\nCaso queira renovar seu passaporte com tranquilidade, estamos à disposição.`;
  return `Olá, ${name}.\n\nIdentificamos uma informação importante sobre a validade do seu visto americano.\n\nA renovação pode ser mais simples quando feita dentro do prazo adequado, especialmente quando ainda existe possibilidade de renovação sem entrevista, conforme as regras vigentes.\n\nSe desejar, podemos analisar seu caso e orientar o melhor momento para iniciar a renovação.`;
}

export default function CentralEventosPage(){
  const [clients,setClients]=useState([]),[dismissed,setDismissed]=useState(new Set()),[tab,setTab]=useState("todos"),[preview,setPreview]=useState(null);
  async function load(){
    const [cr,dr]=await Promise.all([fetch("/api/admin/clients",{cache:"no-store"}),fetch("/api/admin/events/dismiss",{cache:"no-store"})]);
    const cd=await cr.json(); if(!cr.ok){alert(cd.error||"Erro ao carregar clientes."); return;} setClients(cd.clients||[]);
    const dd=await dr.json(); if(dr.ok) setDismissed(new Set(dd.dismissed||[]));
  }
  useEffect(()=>{load();},[]);
  const events=useMemo(()=>{
    const list=[];
    clients.forEach(client=>{
      const concluded=!!(client.is_completed||client.stage_ready_to_archive||client.visa_result==="approved"||client.stage_passport_returned);
      if(birthdayToday(client.birth_date)) list.push({key:`birthday-${client.id}-${new Date().getFullYear()}`,type:"birthday",category:concluded?"aniversario_concluido":"aniversario_andamento",title:concluded?"Aniversário — cliente concluído/aprovado":"Aniversário — processo em andamento",client,date:client.birth_date,severity:concluded?"relacionamento":"atenção manual"});
      const pd=daysUntil(client.passport_expiration_date);
      if(pd!==null){
        if(pd<=370&&pd>=330) list.push({key:`passport-12m-${client.id}-${client.passport_expiration_date}`,type:"passport",category:"passaporte",title:"Passaporte vence em aproximadamente 12 meses",client,date:client.passport_expiration_date,severity:"preventivo"});
        if(pd<=190&&pd>=150) list.push({key:`passport-6m-${client.id}-${client.passport_expiration_date}`,type:"passport",category:"passaporte",title:"Passaporte vence em aproximadamente 6 meses",client,date:client.passport_expiration_date,severity:"importante"});
        if(pd<0) list.push({key:`passport-expired-${client.id}-${client.passport_expiration_date}`,type:"passport",category:"passaporte",title:"Passaporte vencido",client,date:client.passport_expiration_date,severity:"atenção"});
      }
      const vd=daysUntil(client.visa_expiration_date);
      if(vd!==null){
        const after=-vd;
        if(vd<=370&&vd>=330) list.push({key:`visa-12m-${client.id}-${client.visa_expiration_date}`,type:"visa",category:"visto",title:"Visto vence em aproximadamente 1 ano",client,date:client.visa_expiration_date,severity:"preventivo"});
        if(vd<=190&&vd>=150) list.push({key:`visa-6m-${client.id}-${client.visa_expiration_date}`,type:"visa",category:"visto",title:"Visto vence em aproximadamente 6 meses",client,date:client.visa_expiration_date,severity:"importante"});
        if(vd===0) list.push({key:`visa-today-${client.id}-${client.visa_expiration_date}`,type:"visa",category:"visto",title:"Visto vence hoje",client,date:client.visa_expiration_date,severity:"atenção"});
        if(after>=170&&after<=200) list.push({key:`visa-after-6m-${client.id}-${client.visa_expiration_date}`,type:"visa",category:"visto",title:"Visto vencido há aproximadamente 6 meses",client,date:client.visa_expiration_date,severity:"urgente elegante"});
      }
    });
    return list.filter(e=>!dismissed.has(e.key)).filter(e=>tab==="todos"||e.category===tab).sort((a,b)=>(a.client.name||"").localeCompare(b.client.name||"","pt-BR"));
  },[clients,dismissed,tab]);
  async function dismiss(event,action="treated"){
    const r=await fetch("/api/admin/events/dismiss",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({event_key:event.key,event_type:event.type,client_id:event.client.id,action})});
    const d=await r.json(); if(!r.ok){alert(d.error||"Erro ao baixar evento."); return;} setDismissed(c=>new Set([...c,event.key]));
  }
  function openWhatsApp(event){ const phone=cleanPhone(event.client.phone); if(!phone){alert("Cliente sem telefone cadastrado."); return;} window.open(`https://wa.me/${phone}?text=${encodeURIComponent(messageFor(event))}`,"_blank","noopener,noreferrer"); }
  return <main style={{maxWidth:1180,margin:"30px auto",padding:24,fontFamily:"Arial, Helvetica, sans-serif"}}>
    <h1 style={{color:"#1f2a60"}}>Central de Eventos</h1><p>Automação assistida: o sistema detecta oportunidades e prepara mensagens, mas você decide o envio.</p>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",margin:"18px 0"}}>{[["todos","Todos"],["aniversario_concluido","Aniversários concluídos"],["aniversario_andamento","Aniversários em andamento"],["passaporte","Passaporte"],["visto","Visto americano"]].map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{padding:"10px 14px",borderRadius:10,border:0,background:tab===k?"#1f2a60":"#e5e7eb",color:tab===k?"#fff":"#111827"}}>{l}</button>)}</div>
    <div style={{display:"grid",gap:14}}>{events.map(event=><section key={event.key} style={{border:"1px solid #e5e7eb",borderRadius:16,background:"#fff",padding:18}}>
      <h3 style={{margin:"0 0 6px",color:"#1f2a60"}}>{event.title}</h3><p><strong>{event.client.name}</strong></p><p>Data: {formatDateBR(event.date)} • {event.severity}</p><p>{event.client.email||"-"} • {event.client.phone||"-"}</p>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={()=>setPreview(event)}>Visualizar mensagem</button><button onClick={()=>openWhatsApp(event)}>WhatsApp</button><button onClick={()=>dismiss(event,"treated")}>Marcar tratado</button><button onClick={()=>dismiss(event,"ignored")}>Ignorar</button>{event.type==="passport"&&<button onClick={()=>dismiss(event,"passport_renewed")}>Passaporte renovado</button>}{event.type==="visa"&&<button onClick={()=>dismiss(event,"visa_renewed")}>Visto renovado</button>}</div>
    </section>)}</div>
    {events.length===0&&<p>Nenhum evento pendente nesta visão.</p>}
    {preview&&<div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setPreview(null)}><div style={{background:"#fff",borderRadius:18,padding:24,maxWidth:760,width:"94vw"}} onClick={e=>e.stopPropagation()}><button style={{float:"right"}} onClick={()=>setPreview(null)}>×</button><h2>{preview.title}</h2><textarea readOnly value={messageFor(preview)} style={{width:"100%",minHeight:260,padding:12,borderRadius:12,border:"1px solid #d1d5db",fontSize:15,lineHeight:1.5}}/><p>Use este texto como base. Nesta etapa não há envio automático externo.</p></div></div>}
  </main>;
}
