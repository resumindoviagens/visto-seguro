import "./globals.css";

export const metadata = {
  title: "Resumindo Viagens - Formulário de Visto",
  description: "Formulário para inserção de dados para solicitação de Visto"
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
