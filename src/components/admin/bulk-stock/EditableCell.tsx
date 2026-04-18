"use client";

import { forwardRef, KeyboardEvent, ChangeEvent, ClipboardEvent, FocusEvent } from "react";

type BaseProps = {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  onPaste?: (e: ClipboardEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onFocus?: (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
  invalid?: boolean;
  placeholder?: string;
  className?: string;
};

type TextCellProps = BaseProps & { kind: "text" };
type NumberCellProps = BaseProps & { kind: "number"; min?: number };
type SelectCellProps = BaseProps & { kind: "select"; options: readonly string[] };

type Props = TextCellProps | NumberCellProps | SelectCellProps;

const baseInput =
  "w-full h-full px-2 py-1.5 text-sm bg-transparent rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all";

export const EditableCell = forwardRef<HTMLInputElement | HTMLSelectElement, Props>(
  function EditableCell(props, ref) {
    const { value, onChange, onKeyDown, onPaste, onFocus, invalid, placeholder, className = "" } = props;

    const invalidCls = invalid ? "ring-2 ring-red-400 bg-red-50 dark:bg-red-950/30" : "";
    const combined = `${baseInput} ${invalidCls} ${className}`.trim();

    if (props.kind === "select") {
      return (
        <select
          ref={ref as React.Ref<HTMLSelectElement>}
          value={value}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onFocus={onFocus}
          className={combined}
        >
          <option value="" disabled hidden>{placeholder ?? "Select..."}</option>
          {props.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    return (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        type={props.kind === "number" ? "number" : "text"}
        min={props.kind === "number" ? (props.min ?? 0) : undefined}
        step={props.kind === "number" ? "any" : undefined}
        inputMode={props.kind === "number" ? "decimal" : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onFocus={onFocus}
        className={combined}
      />
    );
  }
);
