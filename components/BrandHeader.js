export default function BrandHeader({ clientName, compact = false }) {
  return (
    <div className="brand-header brand-header-enhanced">
      <img src="/logo.png" alt="Resumindo Viagens" />

      <div className="brand-main">
        <h1 className="brand-title">Resumindo Viagens</h1>

        <div className="brand-subtitle">
          Formulário para inserção de dados para solicitação de Visto
        </div>

        {!compact && (
          <div className="brand-explanation">
            Este não é o formulário do consulado, suas informações serão analisadas, traduzidas para inglês e inseridas no formulário oficial do consulado.
          </div>
        )}

        {!compact && (
          <div className="brand-contact">
            contato@resumindoviagens.com.br •{" "}
            <a href="https://www.instagram.com/resumindoviagens" target="_blank" rel="noopener noreferrer">
              Instagram: @resumindoviagens
            </a>
          </div>
        )}
      </div>

      {!compact && clientName && (
        <div className="brand-client">
          <span>Cliente</span>
          <strong>{clientName}</strong>
        </div>
      )}
    </div>
  );
}
