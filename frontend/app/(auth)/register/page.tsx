import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Regístrate en tu espacio Horus.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
