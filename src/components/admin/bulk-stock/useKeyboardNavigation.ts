import { useCallback } from "react";

export type CellPos = { row: number; col: number };

export function useKeyboardNavigation(opts: {
  rowCount: number;
  colCount: number;
  moveTo: (pos: CellPos, extend: boolean) => void;
  onEnterAtLastCell: () => void;
  onBackspaceEmptyRow: (row: number) => void;
  onCopy: () => boolean; // returns true when handled (preventDefault)
}) {
  const { rowCount, colCount, moveTo, onEnterAtLastCell, onBackspaceEmptyRow, onCopy } = opts;

  return useCallback(
    (e: React.KeyboardEvent<HTMLElement>, pos: CellPos, isEmptyRow: boolean, isCellEmpty: boolean) => {
      const { row, col } = pos;
      const lastRow = rowCount - 1;
      const lastCol = colCount - 1;
      const extend = e.shiftKey;

      // Copy (TSV) for multi-cell selection — handled in grid via onCopy
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
        if (onCopy()) e.preventDefault();
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          if (col > 0) moveTo({ row, col: col - 1 }, false);
          else if (row > 0) moveTo({ row: row - 1, col: lastCol }, false);
        } else {
          if (col < lastCol) moveTo({ row, col: col + 1 }, false);
          else if (row < lastRow) moveTo({ row: row + 1, col: 0 }, false);
          else onEnterAtLastCell();
        }
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (row === lastRow && col === lastCol) {
          onEnterAtLastCell();
        } else if (row < lastRow) {
          moveTo({ row: row + 1, col }, false);
        }
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (row > 0) moveTo({ row: row - 1, col }, extend);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (row < lastRow) moveTo({ row: row + 1, col }, extend);
        return;
      }

      if (e.key === "ArrowLeft") {
        const target = e.currentTarget as HTMLInputElement | HTMLSelectElement;
        if (!extend && "selectionStart" in target && target.selectionStart !== 0) return;
        e.preventDefault();
        if (col > 0) moveTo({ row, col: col - 1 }, extend);
        return;
      }

      if (e.key === "ArrowRight") {
        const target = e.currentTarget as HTMLInputElement | HTMLSelectElement;
        if (
          !extend &&
          "selectionStart" in target &&
          target.selectionStart !== null &&
          target.value &&
          target.selectionStart < target.value.length
        ) {
          return;
        }
        e.preventDefault();
        if (col < lastCol) moveTo({ row, col: col + 1 }, extend);
        return;
      }

      if (e.key === "Backspace" && isCellEmpty && isEmptyRow && rowCount > 1) {
        e.preventDefault();
        onBackspaceEmptyRow(row);
      }
    },
    [rowCount, colCount, moveTo, onEnterAtLastCell, onBackspaceEmptyRow, onCopy]
  );
}
