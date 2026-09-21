"use client";

export default function DeleteSimulationButton() {
  return (
    <button
      type="submit"
      onClick={(event) => {
        const confirmed = window.confirm(
          "Excluir este simulado? As respostas e questões de teste vinculadas também serão removidas."
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:border-red-400/40 hover:bg-red-500/15"
    >
      Excluir
    </button>
  );
}
