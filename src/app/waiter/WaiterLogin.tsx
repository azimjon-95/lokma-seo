"use client";

import { useState } from "react";
import { Eye, EyeOff, Utensils } from "lucide-react";
import { ApiError } from "@/lib/dinein/api";

export function WaiterLogin({
  onLogin,
}: {
  onLogin: (login: string, password: string) => Promise<void>;
}) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      await onLogin(login.trim().toLowerCase(), password);
    } catch (e) {
      setError((e as ApiError).message);
      setBusy(false);
    }
  };


  return (
    <main className="wt-page">

      <section className="wt-card">

        <div className="wt-logo">
          <div className="wt-logo-icon">
            <Utensils size={32}/>
          </div>

          <h1>
            LokmaGo
          </h1>

          <span>
            Dine-in Waiter
          </span>
        </div>


        <div className="wt-header">

          <h2>
            Ofitsiant kirishi
          </h2>

          <p>
            Restoran buyurtmalarini boshqarish
          </p>

        </div>



        <div className="wt-form">


          <input
            value={login}
            onChange={(e)=>setLogin(e.target.value)}
            placeholder="Login"
            autoComplete="username"
          />


          <div className="wt-password">

            <input
              type={showPassword ? "text":"password"}
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              placeholder="Parol"
              autoComplete="current-password"
            />


            <button
              type="button"
              onClick={()=>setShowPassword(!showPassword)}
            >
              {
                showPassword 
                ? <EyeOff size={20}/>
                : <Eye size={20}/>
              }
            </button>

          </div>



          {
            error &&
            <div className="wt-error">
              {error}
            </div>
          }



          <button
            onClick={submit}
            disabled={busy}
            className="wt-submit"
          >

            {
              busy
              ? "Tekshirilmoqda..."
              : "Kirish"
            }

          </button>


        </div>



        <div className="wt-device">

          <div className="wt-device-icon">
            🔒
          </div>


          <div>
            <b>
              Qurilma himoyasi
            </b>

            <p>
              Birinchi kirishda ushbu telefon waiter akkauntiga
              xavfsiz bog‘lanadi.
              Keyingi kirishlar faqat tasdiqlangan qurilmadan ishlaydi.
            </p>

          </div>


        </div>


      </section>


    </main>
  );
}