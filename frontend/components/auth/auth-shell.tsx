import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f4f6f8] p-4 sm:p-8">
      <div className="mx-auto grid min-h-[min(760px,calc(100vh-4rem))] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_90px_-40px_rgba(10,37,64,0.35)] lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden overflow-hidden bg-[#0a2540] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div
            aria-hidden="true"
            className="absolute -right-36 -top-32 size-[30rem] rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-56 -left-36 size-[36rem] rounded-full border border-white/10"
          />
          <div
            aria-label="Volver a Horus Group"
            className="relative flex w-fit items-center gap-3"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-[#e8bd4c] text-[#0a2540]">
              <ShieldCheck aria-hidden="true" size={25} />
            </span>
            <span className="text-sm font-bold tracking-[0.16em]">
              HORUS <span className="font-normal">GROUP</span>
              <span className="mt-1 block text-[9px] font-medium tracking-[0.2em] text-white/55">
                TECNOLOGÍA · EDUCACIÓN · FUTURO
              </span>
            </span>
          </div>

          <div className="relative max-w-md">
            <p className="mb-5 text-xs font-semibold tracking-[0.24em] text-[#e8bd4c]">
              CRECE CON CONFIANZA
            </p>
            <h1 className="text-5xl font-semibold leading-[1.12] tracking-tight xl:text-6xl">
              Ideas que
              <br />
              <span className="text-[#e8bd4c]">abren caminos.</span>
            </h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-white/65">
              Un solo lugar para conectar con tecnología, aprendizaje y nuevas
              oportunidades.
            </p>
          </div>

          <div className="relative flex items-center gap-3 text-xs text-white/60">
            <span className="size-2 rounded-full bg-emerald-400" />
            Cajamarca, Perú
            <span className="h-px w-8 bg-white/25" />
            Horus Group SRL
          </div>
        </aside>

        <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-14">
          <div className="w-full max-w-[390px]">
            <div
              aria-label="Horus Group"
              className="mb-10 flex w-fit items-center gap-2 text-sm font-bold tracking-[0.14em] text-[#0a2540] lg:hidden"
            >
              <ShieldCheck aria-hidden="true" className="text-[#b48a21]" size={22} />
              HORUS GROUP
            </div>

            {children}
          </div>
        </section>
      </div>
      <p className="mt-5 text-center text-[10px] text-slate-400">
        © {new Date().getFullYear()} Horus Group SRL · Cajamarca, Perú
      </p>
    </main>
  );
}
