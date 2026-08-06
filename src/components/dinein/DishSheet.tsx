"use client";

import { useState, useMemo, useEffect } from "react";
import type { Dish, DishOption } from "@/lib/dinein/api";
import { som } from "@/lib/dinein/format";

/** Taom oynasi — variantlar tanlanadi. */
export function DishSheet({
  dish,
  onClose,
  onAdd,
}: {
  dish: Dish;
  onClose: () => void;
  onAdd: (quantity: number, options: DishOption[]) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  // Orqa fon scroll bo'lmasin
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const options = useMemo(() => {
    const list: DishOption[] = [];
    for (const group of dish.optionGroups || []) {
      for (const name of selected[group.name] || []) {
        const found = group.options.find((o) => o.name === name);
        if (found) list.push(found);
      }
    }
    return list;
  }, [dish.optionGroups, selected]);

  const unitPrice = dish.price + options.reduce((s, o) => s + (o.price || 0), 0);

  const toggle = (groupName: string, optionName: string, multiple: boolean) => {
    setSelected((prev) => {
      const current = prev[groupName] || [];
      if (multiple) {
        return {
          ...prev,
          [groupName]: current.includes(optionName)
            ? current.filter((n) => n !== optionName)
            : [...current, optionName],
        };
      }
      return { ...prev, [groupName]: current.includes(optionName) ? [] : [optionName] };
    });
  };

  // Majburiy guruhlar tanlanganmi
  const canAdd = (dish.optionGroups || [])
    .filter((g) => g.required)
    .every((g) => (selected[g.name] || []).length > 0);

  return (
    <div className="di-sheet" onClick={onClose}>
      <div className="di-sheet__box" onClick={(e) => e.stopPropagation()}>
        <div className="di-sheet__handle" />

        {dish.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dish.imageUrl} alt="" className="di-sheet__img" />
        )}

        <div className="di-sheet__body">
          <h2 className="di-sheet__name">{dish.name}</h2>
          {dish.description && (
            <p className="di-sheet__desc">{dish.description}</p>
          )}

          {(dish.weight || dish.volume || dish.calories) && (
            <div className="di-sheet__facts">
              {dish.weight && <span>{dish.weight}</span>}
              {dish.volume && <span>{dish.volume}</span>}
              {dish.calories ? <span>{dish.calories} ккал</span> : null}
            </div>
          )}

          {/* Variantlar */}
          {(dish.optionGroups || []).map((group) => (
            <div key={group.name} className="di-group">
              <div className="di-group__title">
                {group.name}
                {group.required && <span className="di-group__req">majburiy</span>}
              </div>

              {group.options.map((opt) => {
                const active = (selected[group.name] || []).includes(opt.name);
                return (
                  <button
                    key={opt.name}
                    onClick={() => toggle(group.name, opt.name, Boolean(group.multiple))}
                    className={`di-option ${active ? "is-active" : ""}`}
                  >
                    <span className="di-option__mark">{active ? "✓" : ""}</span>
                    <span className="di-option__name">{opt.name}</span>
                    {opt.price > 0 && (
                      <span className="di-option__price">+{som(opt.price)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Pastki panel */}
        <div className="di-sheet__footer">
          <div className="di-qty">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity((q) => Math.min(50, q + 1))}>+</button>
          </div>

          <button
            onClick={() => onAdd(quantity, options)}
            disabled={!canAdd}
            className="di-btn di-btn--primary"
          >
            Savatga · {som(unitPrice * quantity)}
          </button>
        </div>
      </div>
    </div>
  );
}
