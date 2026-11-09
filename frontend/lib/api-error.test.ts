import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { getApiErrorMessage } from "./api-error";

function axiosError(data: unknown): AxiosError {
  const error = new AxiosError("fail");
  error.response = { data } as AxiosResponse;
  return error;
}

describe("getApiErrorMessage", () => {
  it("prefiere los errores por campo", () => {
    const error = axiosError({
      message: "Revisa los datos ingresados.",
      errors: { email: ["Correo inválido."], name: ["Requerido."] },
    });
    expect(getApiErrorMessage(error, "x")).toBe("Correo inválido. Requerido.");
  });

  it("usa message string o arreglo", () => {
    expect(getApiErrorMessage(axiosError({ message: "Hola" }), "x")).toBe("Hola");
    expect(getApiErrorMessage(axiosError({ message: ["a", "b"] }), "x")).toBe("a b");
  });

  it("cae al texto por defecto", () => {
    expect(getApiErrorMessage(new Error("boom"), "por defecto")).toBe("por defecto");
    expect(getApiErrorMessage(axiosError({}), "por defecto")).toBe("por defecto");
  });
});
