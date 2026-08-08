"use client";

import type { WaiterTable } from "@/lib/dinein/api";
import { num } from "@/lib/dinein/format";

/**
 * Stollar ro'yxati — qatorda ikkitadan.
 *
 * Har stol yumaloq, atrofida stullar. Bosmasdan ko'rinadi:
 * bo'sh yoki band, nechta mijoz o'tirgan, buyurtma summasi.
 */
export function TableGrid({
  tables,
  onSelect,
}: {
  tables: WaiterTable[];
  onSelect: (t: WaiterTable) => void;
}) {
  return (
    <div className="tg">
      {tables.map((t) => (
        <TableCard key={t._id} table={t} onClick={() => onSelect(t)} />
      ))}
    </div>
  );
}

function TableCard({
  table,
  onClick,
}: {
  table: WaiterTable;
  onClick: () => void;
}) {
  const busy = Boolean(table.isBusy || table.guestCount);
  const guests = table.guestCount || 0;
  // Stullar soni mijozlarga qarab ko'payadi. Sig'imdan ko'p mehmon
  // kelsa (4 joyli stolda 6 kishi) qo'shimcha stul chiziladi —
  // aks holda "6/4" yozilib, atrofda 4 ta stul turardi.
  const capacity = table.capacity || 4;
  const seats = Math.min(14, Math.max(2, capacity, guests));
  const extra = Math.max(0, guests - capacity);

  return (
    <button onClick={onClick} className={`tg-card ${busy ? "is-busy" : ""}`}>
      {/* Stol chizmasi */}
      <div className={`tg-table ${seats > 8 ? "is-crowded" : ""}`}>
        {/* Stullar — stol atrofida aylana bo'ylab */}
        {Array.from({ length: seats }).map((_, i) => {
          // Yuqoridan boshlanadi
          const angle = (i / seats) * 360 - 90;
          const taken = i < guests;
          // Sig'imdan ortiq stullar — qo'shimcha ekani ko'rinib tursin
          const isExtra = i >= capacity;
          // Stul ko'p bo'lsa aylana kattaroq, bir-biriga tegmasin
          const radius = seats > 8 ? 50 : 42;

          return (
            <span
              key={i}
              className={`tg-chair ${taken ? "is-taken" : ""} ${isExtra ? "is-extra" : ""}`}
              style={{ transform: `rotate(${angle}deg) translateY(-${radius}px)` }}
            >
              <span className="tg-chair__back" />
              <span className="tg-chair__seat" />
            </span>
          );
        })}

        {/* Stol usti */}
        <span className="tg-top">
          <span className="tg-top__num">{table.tableNumber}</span>
        </span>
      </div>

      {/* Ma'lumot */}
      <div className="tg-info">
        <div className="tg-info__name">
          {table.tableName || `Stol ${table.tableNumber}`}
        </div>

        <div className={`tg-info__status ${busy ? "is-busy" : "is-free"}`}>
          {busy ? `Band · ${guests}/${capacity}${extra > 0 ? ` +${extra}` : ""}` : "Bo'sh"}
        </div>

        {busy && table.orderTotal ? (
          <div className="tg-info__total">{num(table.orderTotal)} so&apos;m</div>
        ) : null}
      </div>
    </button>
  );
}
