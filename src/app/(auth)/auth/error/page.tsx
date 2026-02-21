"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "Hay un problema con la configuración del servidor.",
    AccessDenied: "No tenés permiso para acceder.",
    Verification: "El link de verificación expiró o ya fue usado.",
    OAuthSignin: "Error al iniciar el flujo de OAuth.",
    OAuthCallback: "Error al procesar el callback de OAuth.",
    OAuthCreateAccount: "Error al crear la cuenta con OAuth.",
    EmailCreateAccount: "Error al crear la cuenta con email.",
    Callback: "Error en el callback de autenticación.",
    OAuthAccountNotLinked: "Este email ya está asociado a otra cuenta.",
    Default: "Error desconocido de autenticación.",
  };

  const message = error
    ? errorMessages[error] || errorMessages.Default
    : errorMessages.Default;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="header-bar text-lg px-4 py-3">
        BILARDEANDO — Error de Autenticación
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="card-retro w-full max-w-lg">
          <div className="header-bar-accent text-center text-lg px-4 py-3">
            Error de Login
          </div>
          <div className="card-retro-body space-y-4 py-6">
            <div className="card-retro">
              <div className="card-retro-body p-0">
                <table className="table-retro">
                  <tbody>
                    <tr>
                      <td className="font-bold">Código</td>
                      <td className="font-mono">{error || "unknown"}</td>
                    </tr>
                    <tr>
                      <td className="font-bold">Mensaje</td>
                      <td>{message}</td>
                    </tr>
                    <tr>
                      <td className="font-bold">URL completa</td>
                      <td className="font-mono text-xs break-all">
                        {typeof window !== "undefined" ? window.location.href : ""}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Revisá <code>/api/health/auth-error</code> para ver el error detallado del servidor.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/login" className="btn-retro-primary">
                Volver a intentar
              </Link>
              <Link href="/" className="btn-retro-outline">
                Ir al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  );
}
