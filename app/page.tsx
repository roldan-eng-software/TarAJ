export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Sistema Kanban para Tarefas da Associação Jurídica Regional 507
        </h1>
        <p className="text-gray-600 mb-8">Acompanhamento de tarefas dos Colaboradores</p>
        <a
          href="/login"
          className="inline-block px-6 py-3 bg-sky-500 text-white font-medium rounded hover:bg-sky-600 transition"
        >
          Entrar no Sistema
        </a>
      </div>
    </main>
  );
}
