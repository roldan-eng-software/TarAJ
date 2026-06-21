export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 lg:p-24 bg-gray-50">
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-2xl text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
          Sistema Kanban para Tarefas da Associação Jurídica Regional 507
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-8">
          Acompanhamento de tarefas dos Colaboradores
        </p>
        <a
          href="/login"
          className="block w-full sm:inline-block sm:w-auto px-6 py-3 bg-sky-500 text-white font-medium rounded hover:bg-sky-600 transition"
        >
          Entrar no Sistema
        </a>
      </div>
    </main>
  );
}
