"use client";

import { useEffect, useMemo, useState } from "react";
import BrandHeader from "../../components/BrandHeader";

function cleanCPF(value) {
  return (value || "").replace(/\D/g, "");
}

function formatDateBR(value) {
  if (!value) return "";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function statusLabel(status) {
  const labels = {
    not_started: "Não iniciado",
    in_progress: "Em preenchimento",
    submitted: "Enviado"
  };
  return labels[status] || status;
}

function actionLabel(action) {
  const labels = {
    client_created: "Cliente cadastrado",
    client_opened_form: "Abriu o formulário",
    client_verified_identity: "Confirmou CPF e data",
    client_saved_form: "Salvou respostas",
    client_submitted_form: "Enviou o formulário",
    unlock: "Formulário desbloqueado",
    new_token: "Novo link gerado",
    client_updated: "Cliente atualizado"
  };
  return labels[action] || action;
}

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetch("/api/admin/status")
      .then((r) => r.json())
      .then((data) => setAuthorized(!!data.authenticated))
      .finally(() => setChecking(false));
  }, []);

  async function loginWithPassword(pass) {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pass })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Senha incorreta.");
    return true;
  }

  async function login() {
    try {
      await loginWithPassword(password);
      setAuthorized(true);
    } catch (error) {
      alert(error.message || "Erro ao entrar.");
    }
  }

  if (checking) return <main style={{ padding: 30 }}>Carregando...</main>;

  if (!authorized) {
    return (
      <main style={{ maxWidth: 480, margin: "60px auto", padding: 20 }}>
        <div className="card" style={{ padding: 28 }}>
          <BrandHeader compact />
          <h2 style={{ color: "var(--navy)", marginTop: 24 }}>Painel interno seguro</h2>
          <p>Digite a senha administrativa.</p>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <br /><br />
          <button className="btn-primary" onClick={login}>Entrar</button>
        </div>
      </main>
    );
  }

  return <Dashboard loginWithPassword={loginWithPassword} />;
}

function Dashboard({ loginWithPassword }) {
  const [clients, setClients] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logClient, setLogClient] = useState(null);
  const [logLoading, setLogLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({
    name: "",
    cpf: "",
    birth_date: "",
    phone: "",
    email: "",
    notes: ""
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function loadClients() {
    const res = await fetch("/api/admin/clients");
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erro ao carregar clientes.");
      return;
    }
    setClients(data.clients || []);
  }

  async function loadLogs(client) {
    setLogClient(client);
    setLogLoading(true);
    setLogs([]);

    const res = await fetch(`/api/admin/logs?client_id=${client.id}`);
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao carregar log.");
      setLogLoading(false);
      return;
    }

    setLogs(data.logs || []);
    setLogLoading(false);
  }

  useEffect(() => {
    loadClients();
  }, []);

  async function createClient() {
    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro ao cadastrar cliente.");
      return;
    }

    setForm({ name: "", cpf: "", birth_date: "", phone: "", email: "", notes: "" });
    await loadClients();
  }

  async function actionClient(id, action) {
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erro na ação.");
      return;
    }

    await loadClients();
  }

  async function deleteClient(id) {
    const pass = prompt("Digite a senha do sistema para excluir este cliente:");
    if (!pass) return;

    try {
      await loginWithPassword(pass);
    } catch (error) {
      alert("Senha incorreta. Exclusão cancelada.");
      return;
    }

    if (!confirm("Confirmar exclusão do cliente e respostas?")) return;

    const res = await fetch(`/api/admin/clients/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Erro ao excluir.");
      return;
    }

    await loadClients();
  }

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        (client.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (client.cpf || "").includes(cleanCPF(search)) ||
        (client.email || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  function clientLink(client) {
    return `${origin}/acesso/${client.access_token}`;
  }

  async function copyText(text, message = "Copiado.") {
    await navigator.clipboard.writeText(text);
    alert(message);
  }

  function whatsappMessage(client) {
    return `Olá, ${client.name}! Seu formulário da Resumindo Viagens já está pronto para preenchimento.\n\nAcesse seu link único e exclusivo:\n${clientLink(client)}\n\nPor segurança, o acesso será validado com CPF e data de nascimento.\n\nSe outros membros da família também estiverem preenchendo formulário, cada pessoa deverá acessar o próprio link individual.`;
  }

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: 24 }}>
      <div className="card" style={{ padding: 22, marginBottom: 22 }}>
        <BrandHeader />
      </div>

      <div className="card" style={{ padding: 22, marginBottom: 22 }}>
        <h2>Cadastrar cliente</h2>

        <div className="grid">
          <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="CPF" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
          <input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
          <input placeholder="Celular" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <textarea className="wide" placeholder="Observações internas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <button className="btn-primary" onClick={createClient}>
          Cadastrar cliente e gerar link seguro
        </button>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
          <input placeholder="Buscar por nome, CPF ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Todos os status</option>
            <option value="not_started">Não iniciado</option>
            <option value="in_progress">Em preenchimento</option>
            <option value="submitted">Enviado</option>
          </select>
        </div>

        <table width="100%" cellPadding="10" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th align="left">Cliente</th>
              <th align="left">Status</th>
              <th align="left">Link seguro</th>
              <th align="left">Ações</th>
            </tr>
          </thead>

          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                <td>
                  <b>{client.name}</b><br />
                  <small>CPF: {client.cpf}</small><br />
                  <small>Nascimento: {formatDateBR(client.birth_date)}</small><br />
                  <small>Celular: {client.phone || "-"}</small><br />
                  <small>E-mail: {client.email || "-"}</small>
                </td>

                <td>
                  <span className="status-pill" style={{ background: client.status === "submitted" ? "#dcfce7" : "#fff7e8", color: client.status === "submitted" ? "#166534" : "#92400e" }}>
                    {statusLabel(client.status)} {client.is_locked ? "🔒" : ""}
                  </span>
                </td>

                <td>
                  <div className="copy-link">{clientLink(client)}</div>
                  <button className="btn-light" onClick={() => copyText(clientLink(client), "Link copiado.")} style={{ marginTop: 6 }}>
                    Copiar link
                  </button>
                </td>

                <td>
                  <div className="admin-actions">
                    <a className="btn-light" href={`/acesso/${client.access_token}`} target="_blank">Abrir</a>
                    <a className="btn-light" href={`/email/${client.access_token}`} target="_blank">Criar email</a>
                    <a className="btn-light" href={`/admin/pdf/${client.access_token}`} target="_blank">Gerar PDF</a>
                    <button className="btn-light" onClick={() => copyText(whatsappMessage(client), "Mensagem de WhatsApp copiada.")}>Copiar WhatsApp</button>
                    <button className="btn-light" onClick={() => loadLogs(client)}>Ver log</button>
                    <button className="btn-light" onClick={() => actionClient(client.id, "unlock")}>Desbloquear</button>
                    <button className="btn-light" onClick={() => actionClient(client.id, "new_token")}>Novo link</button>
                    <button className="btn-light" onClick={() => deleteClient(client.id)}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logClient && (
        <div className="modal-backdrop" onClick={() => setLogClient(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <h2 style={{ margin: 0 }}>Log de atividade</h2>
              <button className="btn-light" onClick={() => setLogClient(null)}>Fechar</button>
            </div>

            <p style={{ color: "var(--muted)" }}>{logClient.name}</p>

            {logLoading && <p>Carregando log...</p>}

            {!logLoading && logs.length === 0 && (
              <p style={{ color: "var(--muted)" }}>Nenhuma atividade registrada.</p>
            )}

            {!logLoading && logs.map((log) => (
              <div key={log.id} style={{ borderTop: "1px solid #e5e7eb", padding: "12px 0" }}>
                <b style={{ color: "var(--navy)" }}>{actionLabel(log.action)}</b><br />
                <small>{new Date(log.created_at).toLocaleString("pt-BR")}</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
