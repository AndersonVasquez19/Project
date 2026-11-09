"use client";

type Props = {
  options: readonly string[];
  value: readonly string[];
  onChange: (roles: string[]) => void;
  /** Mensaje de error del campo (se anuncia con role="alert"). */
  error?: string;
  emptyMessage?: string;
};

/** Grupo de casillas para elegir roles; lo usan crear usuario y editar roles. */
export function RolePicker({
  options,
  value,
  onChange,
  error,
  emptyMessage = "No hay roles disponibles para asignar.",
}: Props) {
  return (
    <fieldset className="space-y-2" aria-invalid={Boolean(error)}>
      <legend className="admin-label">Roles</legend>
      {options.length === 0 ? (
        <p className="text-sm text-horus-muted">{emptyMessage}</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((role) => (
            <label
              key={role}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-horus-line bg-horus-surface px-3.5 py-2.5 text-sm font-medium text-horus-ink transition hover:border-horus-primary-soft/40"
            >
              <input
                type="checkbox"
                className="admin-checkbox"
                checked={value.includes(role)}
                onChange={(event) =>
                  onChange(
                    event.currentTarget.checked
                      ? [...value, role]
                      : value.filter((current) => current !== role),
                  )
                }
              />
              <span>{role}</span>
            </label>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-horus-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
