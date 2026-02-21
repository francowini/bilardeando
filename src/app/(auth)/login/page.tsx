"use client";

import { signIn } from "next-auth/react";
import { Trophy, LogIn } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
    } else {
      router.push("/squad");
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header bar */}
      <div className="header-bar text-lg px-4 py-3">
        BILARDEANDO — Fantasy Football Argentina
      </div>

      {/* Centered login card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="card-retro w-full max-w-md">
          <div className="header-bar-accent text-center text-lg px-4 py-3">
            Iniciar Sesión
          </div>
          <div className="card-retro-body space-y-6 py-8">
            <Trophy className="w-16 h-16 text-espn-gold mx-auto" />
            <h1 className="font-heading text-3xl font-bold text-espn-green uppercase text-center">
              Bilardeando
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4 px-4">
              <div>
                <label
                  htmlFor="email"
                  className="block font-heading font-bold text-xs uppercase mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="demo1@bilardeando.com"
                  className="w-full px-3 py-2 border-2 border-border bg-background text-foreground font-body text-sm focus:outline-none focus:border-espn-gold"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block font-heading font-bold text-xs uppercase mb-1"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="********"
                  className="w-full px-3 py-2 border-2 border-border bg-background text-foreground font-body text-sm focus:outline-none focus:border-espn-gold"
                />
              </div>

              {error && (
                <p className="text-destructive text-sm font-bold text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-retro-primary w-full text-base px-6 py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <LogIn className="w-5 h-5" />
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>

            {/* Test credentials hint */}
            <div className="border-t-2 border-border pt-4 mx-4">
              <p className="font-heading font-bold text-xs uppercase text-muted-foreground mb-2 text-center">
                Usuarios de prueba
              </p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between px-2 py-1 bg-muted/50">
                  <span className="font-bold">Juan Demo</span>
                  <span>demo1@bilardeando.com</span>
                </div>
                <div className="flex justify-between px-2 py-1">
                  <span className="font-bold">María Demo</span>
                  <span>demo2@bilardeando.com</span>
                </div>
                <div className="flex justify-between px-2 py-1 bg-muted/50">
                  <span className="font-bold">Carlos Demo</span>
                  <span>demo3@bilardeando.com</span>
                </div>
                <p className="text-center mt-2 font-bold">
                  Contraseña: demo123
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
