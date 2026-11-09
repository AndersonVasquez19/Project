"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bot, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api-error";
import { getStatus, sendMessage } from "@/services/asistenteService";
import type {
  AsistenteHistoryItem,
  AsistenteResponse,
} from "@/types/asistente";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: AsistenteResponse["sources"];
  recommendations?: AsistenteResponse["recommendations"];
};

function sourceLink(value: string | null): string | null {
  return value?.startsWith("/") && !value.startsWith("//") ? value : null;
}

export function AsistentePageClient({ canUse }: { canUse: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sessionId] = useState(() => crypto.randomUUID());
  const status = useQuery({
    queryKey: ["assistant-status"],
    queryFn: getStatus,
    enabled: canUse,
    retry: false,
  });
  const chat = useMutation({
    mutationFn: ({
      message,
      history,
    }: {
      message: string;
      history: AsistenteHistoryItem[];
    }) => sendMessage({ message, session_id: sessionId, history }),
    onSuccess: (response, variables) => {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: variables.message,
        },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.answer,
          sources: response.sources,
          recommendations: response.recommendations,
        },
      ]);
    },
  });

  if (!canUse) {
    return (
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-[#172B3A]">Acceso restringido</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          No tienes permiso para usar el asistente.
        </p>
      </section>
    );
  }

  const history: AsistenteHistoryItem[] = messages
    .slice(-10)
    .map(({ role, content }) => ({ role, content }));
  const unavailable = !status.data?.configured || status.isError;
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || chat.isPending || unavailable) return;
    setDraft("");
    chat.mutate({ message, history });
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B9A]">
          Comercial y atención
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-[#172B3A] sm:text-3xl">
          <Bot aria-hidden="true" /> Asistente virtual
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
          Asistente con Gemini. Responde usando únicamente el conocimiento empresarial aprobado y configurado en el backend.
        </p>
      </header>

      {status.isPending ? (
        <p className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#64748B]" role="status">
          Verificando disponibilidad…
        </p>
      ) : unavailable ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
          {status.error
            ? getApiErrorMessage(status.error, "El asistente no está disponible.")
            : "El asistente no está configurado en este entorno. Configura GEMINI_API_KEY en el backend."}
        </p>
      ) : (
        <div className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_10px_rgba(10,37,64,0.04)]">
          <div className="flex items-center gap-2 border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4">
            <Sparkles aria-hidden="true" className="text-[#176B9A]" />
            <div>
              <p className="font-semibold text-[#172B3A]">Horus AI Advisor</p>
              <p className="text-xs text-[#64748B]">Gemini · La clave permanece en el backend</p>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">
            {messages.length === 0 ? (
              <p className="rounded-xl bg-[#F1F8FC] p-4 text-sm leading-6 text-[#334155]">
                Hola. Puedo ayudarte con orientación general. Aún no se ha cargado una base de conocimiento empresarial aprobada; no confirmaré datos de Horus que no estén disponibles.
              </p>
            ) : messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "ml-auto bg-[#0A2540] text-white"
                    : "bg-[#F1F8FC] text-[#172B3A]"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                {message.recommendations?.map((item) => (
                  <div key={item.id} className="mt-3 rounded-lg border border-[#CBD5E1] bg-white p-3 text-[#172B3A]">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#475569]">{item.reason}</p>
                    {item.next_step && <p className="mt-1 text-xs font-medium text-[#176B9A]">{item.next_step}</p>}
                  </div>
                ))}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 border-t border-[#CBD5E1] pt-2">
                    <p className="text-xs font-semibold">Fuentes</p>
                    <ul className="mt-1 space-y-1">
                      {message.sources.map((source) => {
                        const href = sourceLink(source.url_path);
                        return (
                          <li key={source.id} className="text-xs">
                            {href ? (
                              <Link className="underline" href={href}>{source.title}</Link>
                            ) : source.title}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {chat.isPending && (
              <p className="text-sm text-[#64748B]" role="status">El asistente está preparando una respuesta…</p>
            )}
          </div>
          {chat.error && (
            <p className="border-t border-red-100 bg-red-50 px-5 py-3 text-sm text-red-800" role="alert">
              {getApiErrorMessage(chat.error, "No se pudo enviar el mensaje.")}
            </p>
          )}
          <form className="flex gap-2 border-t border-[#E2E8F0] p-4" onSubmit={submit}>
            <Input
              aria-label="Mensaje para el asistente"
              maxLength={2000}
              placeholder="Escribe tu consulta…"
              value={draft}
              onChange={(event) => setDraft(event.currentTarget.value)}
            />
            <Button
              type="submit"
              className="admin-btn-primary"
              aria-label="Enviar mensaje"
              disabled={chat.isPending || !draft.trim()}
            >
              <Send aria-hidden="true" />
            </Button>
          </form>
        </div>
      )}
      <p className="text-xs leading-5 text-[#64748B]">
        No ingreses datos personales o información confidencial. El historial solo se conserva en esta sesión de pantalla y el texto de la consulta se envía a Google Gemini para generar la respuesta.
      </p>
    </section>
  );
}
