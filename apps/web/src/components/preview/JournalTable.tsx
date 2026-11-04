import React from 'react';
import { PaperTable, synthesizeHeaderRows, normalizePaperTable } from '@/types/paper';

interface JournalTableProps {
  table: PaperTable;
  isFullWidth?: boolean;
}

export const JournalTable: React.FC<JournalTableProps> = ({ table, isFullWidth = false }) => {
  const normalized = normalizePaperTable(table);
  const effectiveHeaderRows =
    normalized.headerRows && normalized.headerRows.length > 0
      ? normalized.headerRows
      : synthesizeHeaderRows(normalized.headers || []);
  const hasComplexHeaders = Boolean(effectiveHeaderRows && effectiveHeaderRows.length > 1);
  const hasComplexBody = Boolean(table.bodyRows && table.bodyRows.length > 0);
  const spansAll = isFullWidth || table.columnSpan === '2-column' || (table.isFullWidth !== false && !table.columnSpan);

  return (
    <div
      className={`my-5 break-inside-avoid ${table.isRotated ? 'p-2.5 bg-zinc-50/70 rounded-xl border border-dashed border-zinc-300' : ''}`}
      style={{ columnSpan: spansAll ? 'all' : undefined }}
    >
      {table.isRotated && (
        <div className="mb-2 flex items-center gap-1.5 text-[7.5pt] text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded w-fit font-bold">
          <span>🔄 Bảng xoay ngang 90° (Landscape • Chiếm toàn bộ 2 cột)</span>
        </div>
      )}
      {/* Caption above table - Exact LaTeX: font={small,sf,bf} */}
      <div className="mb-1.5 leading-snug">
        <p
          className="text-[8.5pt] text-gray-900"
          style={{ fontFamily: "'Source Sans 3', Calibri, Arial, sans-serif" }}
        >
          <strong className="text-[#2B74B7] font-bold">Bảng {table.num}: </strong>
          <span>{table.caption}</span>
        </p>
      </div>

      {/* Table grid with exact colors: header = #E5E5E5, rows = alternating #E7ECF7 */}
      <div className="border border-gray-300 overflow-x-auto text-[7.5pt] shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            {effectiveHeaderRows && effectiveHeaderRows.length > 0 ? (
              effectiveHeaderRows.map((hRow, hrIdx) => (
                <tr
                  key={hrIdx}
                  className="bg-[#E5E5E5] border-b border-gray-300 font-bold text-gray-900"
                >
                  {hRow.map((cell, cIdx) => (
                    <th
                      key={cIdx}
                      colSpan={cell.colSpan || 1}
                      rowSpan={cell.rowSpan || 1}
                      className={`p-1.5 border-r last:border-r-0 border-gray-300 ${
                        (cell.colSpan || 1) > 1 ? 'text-center' : 'text-left'
                      }`}
                      style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                    >
                      {cell.text}
                    </th>
                  ))}
                </tr>
              ))
            ) : (
              <tr className="bg-[#E5E5E5] border-b border-gray-300 font-bold text-gray-900">
                {table.headers.map((h, i) => (
                  <th
                    key={i}
                    className="p-1.5 border-r last:border-r-0 border-gray-300"
                    style={{ fontFamily: "'Source Sans 3', sans-serif" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {hasComplexBody && table.bodyRows ? (
              table.bodyRows.map((bRow, rIdx) => {
                const isEven = rIdx % 2 === 0;
                return (
                  <tr
                    key={rIdx}
                    className={isEven ? 'bg-[#E7ECF7]' : 'bg-white'}
                  >
                    {bRow.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        colSpan={cell.colSpan || 1}
                        rowSpan={cell.rowSpan || 1}
                        className={`p-1.5 border-r last:border-r-0 border-gray-300 align-top ${
                          (cell.colSpan || 1) > 1 && cell.text === 'Không báo cáo'
                            ? 'text-center italic text-gray-600'
                            : ''
                        }`}
                        style={{ fontFamily: "'Source Serif 4', serif" }}
                      >
                        {cell.text}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              table.rows.map((row, rI) => {
                const isEven = rI % 2 === 0;
                return (
                  <tr
                    key={rI}
                    className={isEven ? 'bg-[#E7ECF7]' : 'bg-white'}
                  >
                    {row.map((cell, cI) => (
                      <td
                        key={cI}
                        className="p-1.5 border-r last:border-r-0 border-gray-300 align-top"
                        style={{ fontFamily: "'Source Serif 4', serif" }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
