export interface AsistenteHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface AsistenteResponse {
  answer: string;
  intent: string;
  match_level: "alta" | "media" | "baja" | "ninguna";
  needs_clarification: boolean;
  clarification_question: string | null;
  abstained: boolean;
  recommendations: Array<{
    id: string;
    title: string;
    kind: string;
    reason: string;
    next_step: string | null;
  }>;
  sources: Array<{
    id: string;
    title: string;
    url_path: string | null;
  }>;
}

export interface AsistenteStatus {
  configured: boolean;
  status: "disabled" | "ready";
}
