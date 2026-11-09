import { toast } from "sonner";

/** Avisos breves tras una acción. Sustituye al silencio actual al guardar. */
export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast(message),
};
