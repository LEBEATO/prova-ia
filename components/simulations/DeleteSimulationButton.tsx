"use client";

import { useRef, useState } from "react";

export default function DeleteSimulationButton() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function confirmDelete() {
    const form = triggerRef.current?.closest("form");

    if (form) {
      setOpen(false);
      form.requestSubmit();
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:border-red-400/40 hover:bg-red-500/15"
      >
        Excluir
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-simulation-title"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setOpen(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-2xl shadow-black/40 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M4 7h16" />
                  <path d="M9 7V4h6v3" />
                  <path d="M7 7l1 13h8l1-13" />
                  <path d="M10 11v5M14 11v5" />
                </svg>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">
                  Atenção
                </p>
                <h2
                  id="delete-simulation-title"
                  className="mt-1 text-xl font-bold text-white"
                >
                  Excluir este simulado?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  As respostas e as questões de teste vinculadas também serão
                  removidas. Essa ação não poderá ser desfeita.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                className="min-h-11 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
