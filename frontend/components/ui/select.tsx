"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "cn";

function Select<Value, Multiple extends boolean | undefined = false>(
  props: SelectPrimitive.Root.Props<Value, Multiple>,
) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectTrigger({
  className,
  children,
  ...props
}: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#172B3A] shadow-sm outline-none transition focus-visible:border-[#176B9A] focus-visible:ring-2 focus-visible:ring-[#176B9A]/20 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-[#64748B]",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown className="size-4 text-[#64748B]" aria-hidden="true" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectValue(props: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectContent({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Popup>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner sideOffset={4} className="z-[70] outline-none">
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "max-h-64 min-w-[var(--anchor-width)] overflow-hidden rounded-lg border border-[#E2E8F0] bg-white p-1 text-[#172B3A] shadow-xl outline-none",
            className,
          )}
          {...props}
        >
          <SelectPrimitive.ScrollUpArrow className="flex h-5 items-center justify-center bg-white text-[#64748B]">
            <ChevronUp className="size-4" aria-hidden="true" />
          </SelectPrimitive.ScrollUpArrow>
          <SelectPrimitive.List className="max-h-60 overflow-y-auto">
            {children}
          </SelectPrimitive.List>
          <SelectPrimitive.ScrollDownArrow className="flex h-5 items-center justify-center bg-white text-[#64748B]">
            <ChevronDown className="size-4" aria-hidden="true" />
          </SelectPrimitive.ScrollDownArrow>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex min-h-9 cursor-default items-center rounded-md py-1.5 pr-8 pl-2 text-sm outline-none select-none data-[highlighted]:bg-[#F1F5F9] data-[highlighted]:text-[#172B3A] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2 inline-flex items-center">
        <Check className="size-4 text-[#176B9A]" aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
