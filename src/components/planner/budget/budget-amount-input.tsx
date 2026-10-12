"use client";

import { type ChangeEvent, type Dispatch, type SetStateAction } from "react";

import { Input } from "@/components/ui/input";

export function formatBudgetAmountInput(value: string) {
  const clean = value.replace(/[^\d.]/g, "");
  const dot = clean.indexOf(".");
  const whole = (dot < 0 ? clean : clean.slice(0, dot)).replace(/^0+(?=\d)/, "").slice(0, 15);
  const fraction = dot < 0 ? "" : clean.slice(dot + 1).replaceAll(".", "").slice(0, 2);
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dot < 0 ? grouped : `${grouped || "0"}.${fraction}`;
}

export function BudgetAmountInput({ label, value, onChange }: { label: string; value: string; onChange: Dispatch<SetStateAction<string>> }) {
  function change(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const beforeCaret = input.value.slice(0, input.selectionStart ?? input.value.length).replaceAll(",", "").length;
    const formatted = formatBudgetAmountInput(input.value);
    onChange(formatted);
    requestAnimationFrame(() => {
      if (document.activeElement !== input) return;
      let caret = 0;
      let seen = 0;
      while (caret < formatted.length && seen < beforeCaret) {
        if (formatted[caret] !== ",") seen += 1;
        caret += 1;
      }
      input.setSelectionRange(caret, caret);
    });
  }

  return <Input label={label} inputMode="decimal" placeholder="0" value={value} onChange={change} />;
}
