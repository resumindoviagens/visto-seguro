"use client";

import { useState } from "react";

export default function FamilyGroupSyncButton({ client }) {
  const [loading, setLoading] = useState(false);

  const isMaster = client?.grupo_familiar_master === true;
  const hasGroup = !!(client?.grupo_familiar_id || client?.grupo_processo);

  async function syncGroup() {
    if (!isMaster) {
      alert("Defina este cliente como Contato principal do grupo antes de sincronizar.");
      return;
    }

    if (!hasGroup) {
      alert("Preencha o Grupo de processo antes de sincronizar.");
      return;
    }

    const ok = confirm(
      "Sincronizar etapas, barra de progresso, datas e rastreios deste contato principal com os demais membros do grupo?\n\nDados individuais como CPF, nascimento, e-mail e respostas do formulário não serão alterados."
    );

    if (!ok) return;

    setLoading(true);

    try {
      const res = await fetch("/api/admin/sync-family-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterId: client.id })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Não foi possível sincronizar o grupo.");
        return;
      }

      alert(`Grupo sincronizado. ${data.updated || 0} membro(s) atualizado(s).`);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="btn-light"
      onClick={syncGroup}
      disabled={loading || !isMaster || !hasGroup}
      title={!isMaster ? "Disponível apenas no contato principal do grupo." : "Sincronizar grupo familiar"}
    >
      {loading ? "Sincronizando..." : "Sincronizar grupo"}
    </button>
  );
}
