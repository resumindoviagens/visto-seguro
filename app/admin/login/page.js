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
      alert("Informe primeiro o e-mail administrativo.");
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
    <main className="admin-home">
      <style jsx>{`
        .admin-home {
          min-height: 100vh;
          padding: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at top left, rgba(245,158,11,.24), transparent 34%),
            radial-gradient(circle at bottom right, rgba(31,42,96,.24), transparent 32%),
            linear-gradient(135deg, #f8fafc, #eef2ff);
        }

        .shell {
          width: 100%;
          max-width: 1180px;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(360px, .95fr);
          gap: 28px;
        }

        .panel {
          background: rgba(255,255,255,.94);
          border: 1px solid #e5e7eb;
          border-radius: 30px;
          box-shadow: 0 26px 80px rgba(15,23,42,.13);
          overflow: hidden;
        }

        .hero {
          padding: 34px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 610px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          gap: 8px;
          padding: 8px 13px;
          border-radius: 999px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #9a5b00;
          font-size: 13px;
          font-weight: 900;
          margin: 24px 0 18px;
        }

        h1 {
          color: #1f2a60;
          font-size: clamp(36px, 5vw, 58px);
          line-height: 1.02;
          letter-spacing: -1.3px;
          margin: 0 0 18px;
        }

        .subtitle {
          color: #334155;
          font-size: 20px;
          line-height: 1.45;
          margin: 0 0 22px;
        }

        .secure {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e3a8a;
          border-radius: 18px;
          padding: 18px;
          font-weight: 800;
          line-height: 1.45;
        }

        .hero-image {
          margin-top: 28px;
          min-height: 260px;
          border-radius: 24px;
          background-image: url("/login-visto-eua.png");
          background-size: cover;
          background-position: center;
          border: 1px solid #dbe3f0;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.22);
        }

        .login {
          padding: 36px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .login h2 {
          color: #1f2a60;
          font-size: 32px;
          margin: 0 0 8px;
        }

        .login-note {
          color: #64748b;
          margin: 0 0 22px;
          line-height: 1.45;
        }

        .warning {
          background: #fffbeb;
          border: 1px solid #f59e0b;
          color: #92400e;
          border-radius: 16px;
          padding: 14px;
          font-weight: 800;
          line-height: 1.4;
          margin-bottom: 22px;
        }

        form {
          display: grid;
          gap: 14px;
        }

        input {
          width: 100%;
          border: 1px solid #dbe3f0;
          background: #fff;
          border-radius: 15px;
          padding: 16px;
          font-size: 16px;
          outline: none;
        }

        input:focus {
          border-color: #1f2a60;
          box-shadow: 0 0 0 4px rgba(31,42,96,.08);
        }

        .login-button {
          border: 0;
          border-radius: 16px;
          padding: 16px 18px;
          background: #ff9f00;
          color: #fff;
          font-weight: 900;
          font-size: 17px;
          cursor: pointer;
        }

        .login-button:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .forgot {
          margin-top: 16px;
          border: 0;
          background: transparent;
          color: #1f2a60;
          font-weight: 900;
          cursor: pointer;
          text-align: left;
          padding: 0;
          font-size: 15px;
        }

        .client-note {
          margin-top: 28px;
          padding-top: 22px;
          border-top: 1px solid #e5e7eb;
          color: #64748b;
          line-height: 1.45;
          font-size: 14px;
        }

        @media (max-width: 920px) {
          .admin-home {
            padding: 16px;
            align-items: flex-start;
          }

          .shell {
            grid-template-columns: 1fr;
          }

          .hero {
            min-height: auto;
            padding: 24px;
          }

          .login {
            padding: 24px;
          }

          .hero-image {
            min-height: 190px;
          }
        }
      `}</style>

      <div className="shell">
        <section className="panel hero">
          <div>
            <BrandHeader />
            <div className="eyebrow">Portal interno seguro</div>
            <h1>Resumindo Viagens</h1>
            <p className="subtitle">
              Sistema interno para gestão de processos de visto americano, formulários, alertas,
              relatórios e páginas protegidas para clientes.
            </p>
            <div className="secure">
              Este endereço é de uso exclusivo da Resumindo Viagens. O acesso ao painel administrativo
              é restrito a usuários autorizados.
            </div>
          </div>

          <div className="hero-image" aria-label="Imagem temática de viagem e visto americano" />
        </section>

        <section className="panel login">
          <h2>Login administrativo</h2>
          <p className="login-note">
            Entre com o e-mail e senha cadastrados para acessar o painel interno.
          </p>

          <div className="warning">
            Ambiente exclusivo da Resumindo Viagens. Não compartilhe credenciais de acesso.
          </div>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="E-mail administrativo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar no painel"}
            </button>
          </form>

          <button type="button" className="forgot" onClick={forgotPassword}>
            Esqueci minha senha
          </button>

          <div className="client-note">
            Clientes acessam formulários e páginas protegidas somente por links individuais enviados pela Resumindo Viagens.
          </div>
        </section>
      </div>
    </main>
  );
}
