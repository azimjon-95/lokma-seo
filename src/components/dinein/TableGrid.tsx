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
  const seats = Math.min(8, Math.max(2, table.capacity || 4));

  return (
    <button onClick={onClick} className={`tg-card ${busy ? "is-busy" : ""}`}>
      {/* Stol chizmasi */}
      <div className="tg-table">
        {/* Stullar — stol atrofida aylana bo'ylab */}
        {Array.from({ length: seats }).map((_, i) => {
          // Yuqoridan boshlanadi
          const angle = (i / seats) * 360 - 90;
          const taken = i < guests;

          return (
            <span
              key={i}
              className={`tg-chair ${taken ? "is-taken" : ""}`}
              style={{ transform: `rotate(${angle}deg) translateY(-42px)` }}
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
          {busy ? `Band · ${guests}/${table.capacity}` : "Bo'sh"}
        </div>

        {busy && table.orderTotal ? (
          <div className="tg-info__total">{num(table.orderTotal)} so&apos;m</div>
        ) : null}
      </div>
    </button>
  );
}
