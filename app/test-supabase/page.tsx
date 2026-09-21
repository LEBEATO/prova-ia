import { createClient } from "@/lib/supabase/server";

export default async function TestSupabasePage() {
  const supabase = await createClient();

  const { error } = await supabase
    .from("exam_boards")
    .select("id", { count: "exact", head: true });

  const connected = !error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <h1 className="text-3xl font-bold">Teste do Supabase</h1>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-5">
          <p className="text-lg font-semibold">
            {connected
              ? "✅ Next.js conectado ao Supabase."
              : "❌ Não foi possível conectar ao Supabase."}
          </p>

          {!connected && (
            <p className="mt-3 break-words text-sm text-red-300">
              {error?.message}
            </p>
          )}
        </div>

        <p className="mt-5 text-sm text-slate-400">
          Esta página é apenas para validar a conexão inicial e poderá ser removida depois.
        </p>
      </div>
    </main>
  );
}
