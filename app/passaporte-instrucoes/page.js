export const dynamic = "force-dynamic";

const card = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 22,
  padding: 24,
  boxShadow: "0 18px 45px rgba(15,23,42,.08)"
};

const h2 = { color: "#1f2a60", marginTop: 0 };

export default function PassaporteInstrucoesPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f6f8fb", padding: 24, fontFamily: "Arial, Helvetica, sans-serif", color: "#1f2937" }}>
      <section style={{ maxWidth: 920, margin: "20px auto 40px" }}>
        <div style={{ background: "#1f2a60", color: "#fff", borderRadius: 24, padding: "28px 30px", marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 34 }}>Orientações para emissão de passaporte brasileiro</h1>
          <p style={{ margin: "10px 0 0", fontSize: 18, opacity: .95 }}>Resumindo Viagens — instruções para o dia do atendimento na Polícia Federal</p>
        </div>

        <div style={{ ...card, marginBottom: 18, borderLeft: "8px solid #f59e0b" }}>
          <h2 style={h2}>Antes de sair de casa</h2>
          <p>Revise todos os documentos com atenção. A Polícia Federal normalmente não imprime documentos no local.</p>
          <p><strong>Se esquecer algum documento essencial, o atendimento poderá não ser realizado.</strong></p>
          <p>O agendamento possui limite de reagendamentos. Se for necessário remarcar mais vezes, isso pode atrasar o planejamento da viagem.</p>
        </div>

        <div style={card}>
          <h2 style={h2}>Documentos que normalmente devem ser impressos</h2>
          <ul>
            <li>Protocolo do passaporte.</li>
            <li>Comprovante de agendamento.</li>
            <li>Autorização para menor, quando aplicável. Em muitos casos, deixe para assinar na frente do atendente.</li>
          </ul>
          <p><strong>Não é necessário levar comprovante de pagamento da taxa</strong> quando o agendamento já estiver confirmado, pois o agendamento comprova a compensação.</p>
        </div>

        <div style={{ ...card, marginTop: 18 }}>
          <h2 style={h2}>Documentos pessoais</h2>
          <ul>
            <li>Documento de identificação original do solicitante.</li>
            <li>CPF, se não constar no documento apresentado.</li>
            <li>Comprovante de endereço residencial.</li>
            <li>Passaporte anterior mais recente, se houver.</li>
            <li>Certidão de casamento, divórcio, óbito ou decisão judicial, quando houver alteração de nome ou estado civil aplicável.</li>
          </ul>
        </div>

        <div style={{ ...card, marginTop: 18 }}>
          <h2 style={h2}>Atenção para menores de idade</h2>
          <p>Se houver menor de idade no agendamento, em regra ambos os pais devem comparecer.</p>
          <ul>
            <li>Leve documento dos pais, como RG, CNH ou passaporte.</li>
            <li>Leve certidão de nascimento do menor, especialmente se ele não tiver RG.</li>
            <li>Leve certidão de casamento dos pais, quando aplicável.</li>
            <li>Se um dos pais não comparecer, verifique previamente a autorização com assinatura e reconhecimento de firma.</li>
          </ul>
          <p>Em caso de pais separados, divórcio, distância ou impossibilidade de comparecimento, confirme antecipadamente a forma correta da autorização.</p>
        </div>

        <div style={{ ...card, marginTop: 18 }}>
          <h2 style={h2}>Pendências eleitorais</h2>
          <p>Para adultos, antes do atendimento, consulte se há pendências eleitorais, como multa por ausência de voto sem justificativa.</p>
          <p>Se houver pendência, regularize com antecedência, preferencialmente alguns dias úteis antes do atendimento, para que a informação esteja disponível à Polícia Federal.</p>
        </div>

        <div style={{ ...card, marginTop: 18 }}>
          <h2 style={h2}>Foto para passaporte</h2>
          <p>As instruções de foto de passaporte brasileiro são diferentes das instruções do visto americano.</p>
          <ul>
            <li>Crianças menores de 5 anos devem levar 1 foto impressa.</li>
            <li>A foto deve ser 5x7, tirada em casa de fotos.</li>
            <li>Evite roupa branca.</li>
            <li>Preferencialmente, cabelo preso ou sem cobrir o rosto e as orelhas.</li>
          </ul>
        </div>

        <div style={{ ...card, marginTop: 18 }}>
          <h2 style={h2}>No atendimento</h2>
          <p>O atendente da Polícia Federal mostrará os dados na tela.</p>
          <p><strong>Confira tudo com muita atenção:</strong> nome, sobrenomes, grafia, nomes dos pais e cidade de nascimento.</p>
          <p>Se perceber qualquer erro, avise no momento do atendimento.</p>
        </div>

        <div style={{ ...card, marginTop: 18 }}>
          <h2 style={h2}>Após o atendimento</h2>
          <p>Depois do comparecimento, o prazo usual para disponibilização do passaporte é de aproximadamente 8 dias, podendo variar conforme a unidade e a situação do sistema.</p>
          <p>A Resumindo Viagens acompanhará o andamento e avisará quando houver informação de disponibilidade para retirada.</p>
        </div>

        <div style={{ ...card, marginTop: 18, background: "#fff7ed" }}>
          <h2 style={h2}>Dúvidas</h2>
          <p>Em caso de dúvida antes do atendimento, fale com a Resumindo Viagens.</p>
          <p><strong>WhatsApp:</strong> (11) 98121-0932<br /><strong>Email:</strong> contato@resumindoviagens.com.br<br /><strong>Instagram:</strong> @resumindoviagens</p>
        </div>
      </section>
    </main>
  );
}
