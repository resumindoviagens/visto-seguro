export default function FeedbackPage({ params }: { params: { token: string } }) {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Pesquisa de satisfação</h1>
      <p className="mt-2">
        Esta página deve validar o token, solicitar CPF, data de nascimento e código de 6 dígitos
        antes de liberar o formulário.
      </p>

      <div className="mt-6 rounded-2xl border p-4">
        <p className="text-sm text-gray-500">Token recebido:</p>
        <p className="break-all">{params.token}</p>
      </div>
    </main>
  );
}
