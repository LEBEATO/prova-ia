"use client";

import { useFormStatus } from "react-dom";

export default function GenerateSimulationButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-12 w-full rounded-xl bg-violet-600 px-5 py-3 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-52"
    >
      {pending ? "Gerando simulado..." : "Gerar simulado"}
    </button>
  );
}
