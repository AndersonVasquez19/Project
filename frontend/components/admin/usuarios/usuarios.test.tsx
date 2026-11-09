// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CreateUsuarioDialog } from "./CreateUsuarioDialog";
import { usuarioColumns } from "./columns";
import type { Usuario } from "@/types/usuario";

const createUser = vi.hoisted(() => vi.fn());
vi.mock("@/services/usuariosService", () => ({ createUser }));

const usuario: Usuario = { id: "1", name: "Ana Pérez", email: "ana@horus.pe", roles: ["admin"] };

function renderActions(onEditRoles?: (usuario: Usuario) => void) {
  const column = usuarioColumns({ onEditRoles }).find((item) => item.id === "acciones");
  const cell = column?.cell as (ctx: unknown) => React.ReactNode;
  return render(<>{cell({ row: { original: usuario } })}</>);
}

describe("usuarioColumns", () => {
  it("nombra la acción con el usuario y la oculta sin permiso", () => {
    const { unmount } = renderActions(vi.fn());
    expect(screen.getByRole("button", { name: "Editar roles de Ana Pérez" })).toBeTruthy();
    unmount();

    renderActions(undefined);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("ordena solo por nombre y correo", () => {
    const sortable = usuarioColumns({})
      .filter((column) => column.enableSorting)
      .map((column) => column.id);
    expect(sortable).toEqual(["name", "email"]);
  });
});

function renderDialog() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CreateUsuarioDialog
        open
        onOpenChange={vi.fn()}
        roleOptions={["admin", "secretaria"]}
      />
    </QueryClientProvider>,
  );
}

describe("CreateUsuarioDialog", () => {
  it("rechaza contraseña corta y falta de rol sin llamar a la API", async () => {
    createUser.mockReset();
    renderDialog();

    await userEvent.type(screen.getByRole("textbox", { name: /Nombre/ }), "Luis Ríos");
    await userEvent.type(screen.getByRole("textbox", { name: /Correo/ }), "luis@horus.pe");
    await userEvent.type(screen.getByLabelText(/Contraseña inicial/), "corta");
    await userEvent.click(screen.getByRole("button", { name: "Crear usuario" }));

    expect(await screen.findByText(/La contraseña debe tener al menos 12/)).toBeTruthy();
    expect(screen.getByText(/al menos un rol/)).toBeTruthy();
    expect(createUser).not.toHaveBeenCalled();
  });

  it("envía el usuario válido con sus roles", async () => {
    createUser.mockReset();
    createUser.mockResolvedValue({ ...usuario, name: "Luis Ríos" });
    renderDialog();

    await userEvent.type(screen.getByRole("textbox", { name: /Nombre/ }), "Luis Ríos");
    await userEvent.type(screen.getByRole("textbox", { name: /Correo/ }), "luis@horus.pe");
    await userEvent.type(screen.getByLabelText(/Contraseña inicial/), "una-clave-larga-1");
    await userEvent.click(screen.getByRole("checkbox", { name: "secretaria" }));
    await userEvent.click(screen.getByRole("button", { name: "Crear usuario" }));

    // React Query pasa un segundo argumento (contexto); solo importa la entrada.
    await waitFor(() => expect(createUser).toHaveBeenCalled());
    expect(createUser.mock.calls[0][0]).toEqual({
      name: "Luis Ríos",
      email: "luis@horus.pe",
      password: "una-clave-larga-1",
      roles: ["secretaria"],
    });
  });
});
