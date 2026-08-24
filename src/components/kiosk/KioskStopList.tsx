"use client";

import { useState, useEffect, useCallback } from "react";
import { Ban, Search, RotateCcw, CircleCheck } from "lucide-react";
import { kioskApi, type StopDish } from "@/lib/dinein/api";
import { som } from "@/lib/dinein/format";

/**
 * Stop List — vaqtincha tugagan taomlar.
 *
 * Ikki ko'rinish: "Stopda" va "Menyudan qo'shish".
 * Zalda taom tugaganda ofitsiant oshxonaga yugurmasdan
 * shu yerdan belgilab qo'yadi — mijozga darhol ko'rinmay
 * qoladi (server `dish:update` yuboradi).
 */
export function KioskStopList() {
  const [tab, setTab] = useState<"stopped" | "add">("stopped");
  const [stopped, setStopped] = useState<StopDish[]>([]);
  const [all, setAll] = useState<StopDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([
        kioskApi.stopList(),
        kioskApi.allDishes().catch(() => [] as StopDish[]),
      ]);
      setStopped(s);
      setAll(a);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (dish: StopDish, stop: boolean) => {
    if (busyId) return;
    setBusyId(dish._id);

    // Darhol ko'rsatamiz — javob kutmaymiz, zalda tezlik muhim
    if (stop) setStopped((p) => [dish, ...p]);
    else setStopped((p) => p.filter((d) => d._id !== dish._id));

    try {
      await kioskApi.toggleStop(dish._id, stop);
    } catch {
      load();   // xato bo'lsa haqiqiy holatni qaytaramiz
    } finally {
      setBusyId(null);
    }
  };

  const stoppedIds = new Set(stopped.map((d) => d._id));
  const available = all.filter((d) => !stoppedIds.has(d._id));

  const q = query.trim().toLowerCase();
  const list = (tab === "stopped" ? stopped : available)
    .filter((d) => !q || d.name.toLowerCase().includes(q));

  if (loading) {
    return <div className="kio-loading"><div className="di-spinner" /></div>;
  }

  return (
    <div className="kio-stop">

      <div className="kio-stop__tabs">
        <button
          onClick={() => setTab("stopped")}
          className={tab === "stopped" ? "is-on" : ""}
        >
          Stopda
          {stopped.length > 0 && <b>{stopped.length}</b>}
        </button>
        <button
          onClick={() => setTab("add")}
          className={tab === "add" ? "is-on" : ""}
        >
          Menyudan qo‘shish
        </button>
      </div>

      <label className="wt-search kio-stop__search">
        <Search size={16} strokeWidth={2.2} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Taom qidirish..."
          inputMode="search"
        />
      </label>

      {list.length === 0 ? (
        <div className="di-empty">
          <div className="di-empty__icon">
            {tab === "stopped"
              ? <CircleCheck size={34} strokeWidth={1.6} />
              : <Ban size={34} strokeWidth={1.6} />}
          </div>
          <p>
            {query
              ? "Topilmadi"
              : tab === "stopped"
                ? "Stop List bo‘sh — barcha taomlar sotuvda"
                : "Qo‘shish uchun taom yo‘q"}
          </p>
        </div>
      ) : (
        <div className="kio-stop__list">
          {list.map((d) => {
            const isStopped = tab === "stopped";
            return (
              <div key={d._id} className="kio-stop__row">
                <div className="kio-stop__info">
                  <div className="kio-stop__name">{d.name}</div>
                  <div className="kio-stop__price">{som(d.price)}</div>
                </div>

                <button
                  onClick={() => toggle(d, !isStopped)}
                  disabled={busyId === d._id}
                  className={`kio-stop__btn ${isStopped ? "is-back" : "is-stop"}`}
                >
                  {isStopped
                    ? <><RotateCcw size={15} strokeWidth={2.2} /> Qaytarish</>
                    : <><Ban size={15} strokeWidth={2.2} /> Stop</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
