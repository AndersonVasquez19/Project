// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionKeepAlive } from "./use-session-keep-alive";

describe("useSessionKeepAlive", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("sin actividad no envía nada", async () => {
    renderHook(() => useSessionKeepAlive());

    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("con actividad avisa al servidor una vez por minuto", async () => {
    renderHook(() => useSessionKeepAlive());

    window.dispatchEvent(new Event("keydown"));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/refresh", {
      method: "POST",
      credentials: "same-origin",
    });

    // Sin nueva actividad, el siguiente ciclo no envía.
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event("pointerdown"));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("deja de escuchar al desmontar", async () => {
    const { unmount } = renderHook(() => useSessionKeepAlive());
    unmount();

    window.dispatchEvent(new Event("keydown"));
    await vi.advanceTimersByTimeAsync(120_000);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
