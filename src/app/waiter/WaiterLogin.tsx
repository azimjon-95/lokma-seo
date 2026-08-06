"use client";

import { useState } from "react";
import { ApiError } from "@/lib/dinein/api";

/**
 * Ofitsiant kirishi.
 *
 * Birinchi kirishda qurilma bog'lanadi. Bu SERVERDA
 * tekshiriladi — boshqa qurilmadan kirish rad etiladi.
 */
export function WaiterLogin({
  onLogin,
}: {
  onLogin: (login: string, password: string) => Promise<void>;
}) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!login.trim() || !password) {
      setError("Login va parolni kiriting");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await onLogin(login.trim(), password);
    } catch (e) {
      setError((e as ApiError).message);
      setBusy(false);
    }
  };

  return (
    <div className="di-state">
      <div className="wt-login">
        <div className="wt-login__logo">🍽</div>
        <h1 className="wt-login__title">Ofitsiant paneli</h1>
        <p className="wt-login__sub">LokmaGo Dine-in</p>

        <input
          value={login}
          onChange={(e) => setLogin(e.target.value.toLowerCase())}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Login"
          autoCapitalize="none"
          autoComplete="username"
          className="wt-input"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Parol"
          autoComplete="current-password"
          className="wt-input"
        />

        {error && <div className="di-error">{error}</div>}

        <button
          onClick={submit}
          disabled={busy}
          className="di-btn di-btn--primary di-btn--block"
        >
          {busy ? "Kirilmoqda..." : "Kirish"}
        </button>

        <p className="wt-login__note">
          Birinchi kirishda akkaunt shu qurilmaga bog&apos;lanadi.
          Boshqa telefondan kirish uchun administratorga murojaat qiling.
        </p>
      </div>
    </div>
  );
}
