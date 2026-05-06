"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import BrandHeader from "../../../components/BrandHeader";
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

    const redirectTo = `${window.location.origin}/admin/redefinir-senha`;

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
    <main className="home-login-page">
      <style jsx>{`
        .home-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 26px;
          background:
            radial-gradient(circle at top left, rgba(255, 167, 0, 0.22), transparent 34%),
            radial-gradient(circle at bottom right, rgba(31, 42, 96, 0.28), transparent 34%),
            linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
        }
        .hero-card {
          width: 100%;
          max-width: 1120px;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
          gap: 28px;
          align-items: stretch;
        }
        .brand-panel,
        .login-panel {
          background: rgba(255,255,255,0.92);
          border: 1px solid #e5e7eb;
          border-radius: 28px;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
          overflow: hidden;
        }
        .brand-panel {
          padding: 34px;
          position: relative;
          min-height: 560px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .brand-panel::after {
          content: "";
          position: absolute;
          inset: auto -60px -80px auto;
          width: 420px;
          height: 420px;
          background: linear-gradient(135deg, rgba(31,42,96,.12), rgba(255,167,0,.18));
          border-radius: 50%;
          z-index: 0;
        }
        .brand-content {
          position: relative;
          z-index: 1;
        }
        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #fff7ed;
          color: #9a5b00;
          border: 1px solid #fed7aa;
          border-radius: 999px;
          padding: 8px 12px;
          font-weight: 800;
          font-size: 13px;
          margin: 24px 0 18px;
        }
        h1 {
          color: #1f2a60;
          font-size: clamp(34px, 5vw, 56px);
          line-height: 1.02;
          margin: 0 0 18px;
          letter-spacing: -1.2px;
        }
        .subtitle {
          color: #334155;
          font-size: 20px;
          line-height: 1.45;
          margin: 0 0 24px;
          max-width: 630px;
        }
        .security-box {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 18px;
          padding: 18px;
          color: #1e3a8a;
          font-weight: 700;
          line-height: 1.45;
        }
        .theme-visual {
          position: relative;
          z-index: 1;
          margin-top: 28px;
          min-height: 220px;
          border-radius: 24px;
          background:
            linear-gradient(rgba(31,42,96,.72), rgba(31,42,96,.72)),
            url("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80");
          background-size: cover;
          background-position: center;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          padding: 24px;
          color: white;
        }
        .theme-visual strong {
          font-size: 24px;
          display: block;
          margin-bottom: 8px;
        }
        .theme-visual span {
          opacity: 0.92;
          line-height: 1.45;
        }
        .login-panel {
          padding: 34px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .login-title {
          color: #1f2a60;
          font-size: 30px;
          margin: 0 0 8px;
        }
        .login-note {
          color: #64748b;
          margin: 0 0 24px;
          line-height: 1.45;
        }
        .exclusive-alert {
          border: 1px solid #f59e0b;
          background: #fffbeb;
          color: #92400e;
          padding: 14px;
          border-radius: 16px;
          font-weight: 700;
          line-height: 1.4;
          margin-bottom: 22px;
        }
        .form-grid {
          display: grid;
          gap: 14px;
        }
        input {
          width: 100%;
          border: 1px solid #dbe3f0;
          border-radius: 14px;
          padding: 15px 16px;
          font-size: 16px;
          outline: none;
          background: white;
        }
        input:focus {
          border-color: #1f2a60;
          box-shadow: 0 0 0 4px rgba(31,42,96,.08);
        }
        .primary-login {
          border: 0;
          border-radius: 16px;
          background: #ff9f00;
          color: white;
          padding: 15px 18px;
          font-size: 17px;
          font-weight: 900;
          cursor: pointer;
          margin-top: 2px;
        }
        .primary-login:disabled {
          opacity: .65;
          cursor: not-allowed;
        }
        .forgot {
          border: 0;
          background: transparent;
          color: #1f2a60;
          font-weight: 800;
          margin-top: 16px;
          cursor: pointer;
          text-align: left;
          padding: 0;
          font-size: 15px;
        }
        .client-info {
          margin-top: 26px;
          padding-top: 22px;
          border-top: 1px solid #e5e7eb;
          color: #64748b;
          font-size: 14px;
          line-height: 1.45;
        }
        @media (max-width: 920px) {
          .hero-card {
            grid-template-columns: 1fr;
          }
          .brand-panel {
            min-height: auto;
          }
        }
      `}</style>

      <div className="hero-card">
        <section className="brand-panel">
          <div className="brand-content">
            <BrandHeader />
            <div className="eyebrow">Portal interno seguro</div>
            <h1>Resumindo Viagens</h1>
            <p className="subtitle">
              Sistema interno para gestão de processos de visto americano, formulários, alertas, relatórios e orientações protegidas aos clientes.
            </p>
            <div className="security-box">
              Este endereço é de uso exclusivo da Resumindo Viagens. O acesso ao painel administrativo é restrito e monitorado.
            </div>
          </div>

          <div className="theme-visual">
            <div>
              <strong>Assessoria organizada, segura e personalizada.</strong>
              <span>Ambiente reservado para acompanhamento operacional dos processos de visto.</span>
            </div>
          </div>
        </section>

        <section className="login-panel">
          <h2 className="login-title">Login administrativo</h2>
          <p className="login-note">Entre com o e-mail e senha cadastrados no Supabase Auth.</p>

          <div className="exclusive-alert">
            Acesso exclusivo para administradores autorizados da Resumindo Viagens.
          </div>

          <form onSubmit={handleLogin} className="form-grid">
            <input
              type="email"
              placeholder="E-mail administrativo"
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

            <button className="primary-login" type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar no painel"}
            </button>
          </form>

          <button type="button" className="forgot" onClick={forgotPassword}>
            Esqueci minha senha
          </button>

          <div className="client-info">
            Clientes acessam seus formulários e páginas protegidas apenas por links individuais enviados pela Resumindo Viagens.
          </div>
        </section>
      </div>
    </main>
  );
}
