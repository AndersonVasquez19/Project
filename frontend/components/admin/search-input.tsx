import { cn } from "cn";
import type { ComponentProps } from "react";

type SearchInputProps = Omit<
  ComponentProps<"input">,
  "name" | "placeholder" | "type" | "value" | "defaultValue"
> & {
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
};

export function SearchInput({
  name = "busqueda",
  value,
  defaultValue = "",
  placeholder = "Buscar...",
  className,
  ...props
}: SearchInputProps) {
  const inputValue = value === undefined ? { defaultValue } : { value };

  return (
    <label className="relative block w-full">
      <span className="sr-only">{placeholder}</span>
      <i
        className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#64748B]"
        aria-hidden="true"
      />
      <input
        {...props}
        type="search"
        name={name}
        placeholder={placeholder}
        className={cn("admin-input pl-10", className)}
        {...inputValue}
      />
    </label>
  );
}
