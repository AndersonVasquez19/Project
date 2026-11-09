"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  open: boolean;
  pending: boolean;
  action: "annul" | "archive";
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function MatriculaActionConfirm({
  open,
  pending,
  action,
  onOpenChange,
  onConfirm,
}: Props) {
  const isAnnul = action === "annul";
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isAnnul ? "¿Anular esta matrícula?" : "¿Eliminar esta matrícula?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isAnnul
              ? "La matrícula dejará de ocupar un cupo. Esta operación se volverá a validar en el servidor."
              : "La matrícula se eliminará lógicamente y se conservará su historial."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {pending ? "Procesando..." : isAnnul ? "Anular matrícula" : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
