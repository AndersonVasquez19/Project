import axios from "axios";

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (typeof data === "object" && data !== null) {
      if ("errors" in data && typeof data.errors === "object" && data.errors !== null) {
        const messages = Object.values(data.errors).flatMap((value) =>
          Array.isArray(value)
            ? value.filter((item): item is string => typeof item === "string")
            : [],
        );
        if (messages.length > 0) return messages.join(" ");
      }

      if ("message" in data) {
        const { message } = data;
        if (typeof message === "string") return message;
        if (
          Array.isArray(message) &&
          message.every((item) => typeof item === "string")
        ) {
          return message.join(" ");
        }
      }
    }
  }

  return fallback;
}
