import { describe, expect, it, vi } from "vitest";
import { ApiContractError, parseResponse } from "./contract";
import { rolGuardadoSchema, rolesResponseSchema } from "./rol";
import { usuarioActualizadoSchema, usuariosPageSchema } from "./usuario";

const usuario = { id: "1", name: "Ana", email: "ana@horus.pe", roles: ["admin"] };

describe("contrato de usuarios", () => {
  it("acepta la página con roles asignables y la actualización", () => {
    const page = {
      data: [usuario],
      assignableRoles: ["admin", "secretaria"],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    expect(parseResponse(usuariosPageSchema, page, "usuarios").assignableRoles).toHaveLength(2);
    expect(
      parseResponse(usuarioActualizadoSchema, { ...usuario, sessionRevoked: false }, "usuarios")
        .sessionRevoked,
    ).toBe(false);
  });

  it("rechaza una página sin assignableRoles", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const page = { data: [usuario], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    expect(() => parseResponse(usuariosPageSchema, page, "usuarios")).toThrow(ApiContractError);
  });
});

describe("contrato de roles", () => {
  it("acepta la lista y un rol guardado con o sin sessionRevoked", () => {
    const lista = {
      data: [{ id: "1", name: "admin", permissionIds: ["1", "2"], assignedUsers: 1, protected: true }],
      permissions: [{ id: "1", name: "usuarios.ver" }],
    };
    expect(parseResponse(rolesResponseSchema, lista, "roles").data).toHaveLength(1);
    expect(parseResponse(rolGuardadoSchema, { id: "2", name: "x", permissionIds: [] }, "roles").id).toBe("2");
    expect(
      parseResponse(rolGuardadoSchema, { id: "2", name: "x", permissionIds: [], sessionRevoked: true }, "roles")
        .sessionRevoked,
    ).toBe(true);
  });

  it("rechaza un rol sin permissionIds", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => parseResponse(rolGuardadoSchema, { id: "2", name: "x" }, "roles")).toThrow(
      ApiContractError,
    );
  });
});
