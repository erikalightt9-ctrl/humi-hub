import { useCallback } from "react";

export type CellPos = { row: number; col: number };

export function useKeyboardNavigation(opts: {
  rowCount: number;
  colCount: number;
  focusCell: (pos: CellPos) => void;
  onEnterAtLastCell: () => void;
  onBackspaceEmptyRow: (row: number) => void;
}) {
  const { rowCount, colCount, focusCell, onEnterAtLastCell, onBackspaceEmptyRow } = opts;

  return useCallback(
    (e: React.KeyboardEvent<HTMLElement>, pos: CellPos, isEmptyRow: boolean, isCellEmpty: boolean) => {
      const { row, col } = pos;
      const lastRow = rowCount - 1;
      const lastCol = colCount - 1;

      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          if (col > 0) focusCell({ row, col: col - 1 });
          else if (row > 0) focusCell({ row: row - 1, col: lastCol });
        } else {
          if (col < lastCol) focusCell({ row, col: col + 1 });
          else if (row < lastRow) focusCell({ row: row + 1, col: 0 });
          else onEnterAtLastCell();
        }
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (row === lastRow && col === lastCol) {
          onEnterAtLastCell();
        } else if (row < lastRow) {
          focusCell({ row: row + 1, col });
        }
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (row > 0) focusCell({ row: row - 1, col });
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (row < lastRow) focusCell({ row: row + 1, col });
        return;
      }

      if (e.key === "ArrowLeft") {
        const target = e.currentTarget as HTMLInputElement | HTMLSelectElement;
        if ("selectionStart" in target && target.selectionStart !== 0) return;
        e.preventDefault();
        if (col > 0) focusCell({ row, col: col - 1 });
        return;
      }

      if (e.key === "ArrowRight") {
        const target = e.currentTarget as HTMLInputElement | HTMLSelectElement;
        if (
          "selectionStart" in target &&
          target.selectionStart !== null &&
          target.value &&
          target.selectionStart < target.value.length
        ) {
          return;
        }
        e.preventDefault();
        if (col < lastCol) focusCell({ row, col: col + 1 });
        return;
      }

      if (e.key === "Backspace" && isCellEmpty && isEmptyRow && rowCount > 1) {
        e.preventDefault();
        onBackspaceEmptyRow(row);
      }
    },
    [rowCount, colCount, focusCell, onEnterAtLastCell, onBackspaceEmptyRow]
  );
}
