"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type EditableTextProps = {
  value: string;
  placeholder: string;
  label: string;
  selected?: boolean;
  multiline?: boolean;
  focusRequest?: string;
  className?: string;
  onSelect: () => void;
  onCommit: (value: string) => void;
};

function plainText(element: HTMLElement, multiline: boolean) {
  return (multiline ? element.innerText : element.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function EditableText({
  value,
  placeholder,
  label,
  selected,
  multiline = false,
  focusRequest,
  className,
  onSelect,
  onCommit,
}: EditableTextProps) {
  const ref = useRef<HTMLElement>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) ref.current.innerText = value;
  }, [value]);

  useEffect(() => {
    if (!focusRequest || !ref.current) return;
    ref.current.focus();
    const range = document.createRange();
    range.selectNodeContents(ref.current);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [focusRequest]);

  function restore() {
    if (ref.current) ref.current.innerText = value;
  }

  function commit() {
    if (!ref.current) return;
    if (cancelled.current) {
      cancelled.current = false;
      restore();
      return;
    }
    const next = plainText(ref.current, multiline);
    if (next !== value) onCommit(next);
    ref.current.innerText = next;
  }

  function pastePlainText(event: React.ClipboardEvent<HTMLElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain").replace(/\r/g, "");
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    selection.deleteFromDocument();
    const node = document.createTextNode(multiline ? text : text.replace(/\s+/g, " "));
    const range = selection.getRangeAt(0);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  return (
    <span
      ref={ref}
      role="textbox"
      aria-label={label}
      aria-multiline={multiline}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      data-placeholder={placeholder}
      data-empty={!value}
      data-selected={selected || undefined}
      className={cn("editable-text", multiline && "editable-multiline", className)}
      onFocus={() => {
        cancelled.current = false;
        onSelect();
      }}
      onClick={onSelect}
      onBlur={commit}
      onPaste={pastePlainText}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          cancelled.current = true;
          restore();
          ref.current?.blur();
        }
        if (event.key === "Enter" && (!multiline || !event.shiftKey)) {
          event.preventDefault();
          ref.current?.blur();
        }
      }}
    >
      {value}
    </span>
  );
}
