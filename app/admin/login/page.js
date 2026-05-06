"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "../../../lib/supabaseAdminAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createBrowserSupabase();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  async function forgotPassword() {
    if (!email) {
      alert("Informe primeiro o e-mail.");
      return;
    }

    const redirectTo =
      `${window.location.origin}/admin/redefinir-senha`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Enviamos um link de redefinição de senha para seu e-mail.");
  }

  return (
    <main style={{ maxWidth: 420, margin: "60px auto", padding: 24 }}>
      <div className="card">
        <h1>Login administrativo</h1>

        <form onSubmit={handleLogin} style={{ display: "grid", gap: 14 }}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <button
          type="button"
          className="btn-secondary"
          onClick={forgotPassword}
          style={{ marginTop: 16 }}
        >
          Esqueci minha senha
        </button>
      </div>
    </main>
  );
}
