import React from 'react';
import { JournalSectionRendererProps } from './types';
import { JournalFigure } from './JournalFigure';
import { JournalTable } from './JournalTable';

export const JournalSectionRenderer: React.FC<JournalSectionRendererProps> = ({
  paper,
  isTwoColumn,
}) => {
  const { sections } = paper;

  return (
    <div className={isTwoColumn ? 'columns-1 md:columns-2 gap-6' : 'space-y-3'}>
      {sections.map((sec, idx) => {
        // H1 Heading - Exact LaTeX: \fontsize{12pt}{13pt}\selectfont\sffamily\bfseries\color{titlecolor}\MakeTextUppercase
        if (sec.type === 'h1' && sec.title) {
          const displayTitle = sec.title.replace(/TÁ\s+TRÀNG/g, 'TÁ\u00A0TRÀNG');
          return (
            <div key={sec.id || idx} className="break-inside-avoid mt-4 mb-1.5">
              <h2
                className="font-bold text-[12pt] uppercase tracking-normal text-[#2B74B7]"
                style={{
                  fontFamily: "Calibri, 'Myriad Pro', 'Segoe UI', Arial, sans-serif",
                  fontSize: '12pt',
                  lineHeight: '13pt',
                  letterSpacing: '-0.01em',
                  fontWeight: 700,
                }}
              >
                {displayTitle}
              </h2>
            </div>
          );
        }

        // H2 Heading - Exact LaTeX: \fontsize{10pt}{12pt}\selectfont\bfseries\sffamily\color{titlecolor}
        if (sec.type === 'h2' && sec.title) {
          return (
            <div key={sec.id || idx} className="break-inside-avoid mt-3.5 mb-1.5">
              <h3
                className="font-bold text-[10pt] text-[#2B74B7]"
                style={{
                  fontFamily: "Calibri, 'Myriad Pro', 'Segoe UI', Arial, sans-serif",
                  fontSize: '10pt',
                  lineHeight: '12pt',
                  fontWeight: 700,
                }}
              >
                {sec.title}
              </h3>
            </div>
          );
        }

        // H3 Heading - Exact LaTeX: \fontsize{10pt}{12pt}\selectfont\sffamily\bfseries\itshape\color{titlecolor}
        if (sec.type === 'h3' && sec.title) {
          return (
            <div key={sec.id || idx} className="break-inside-avoid mt-3 mb-1">
              <h4
                className="font-bold italic text-[10pt] text-[#2B74B7]"
                style={{
                  fontFamily: "Calibri, 'Myriad Pro', 'Segoe UI', Arial, sans-serif",
                  fontSize: '10pt',
                  lineHeight: '12pt',
                  fontWeight: 700,
                }}
              >
                {sec.title}
              </h4>
            </div>
          );
        }

        // Body Paragraph - Exact LaTeX: 9pt, line-height 1.38, text-align: justify
        if (sec.type === 'paragraph' && sec.content) {
          return (
            <p
              key={sec.id || idx}
              className="text-[9pt] leading-[1.38] text-gray-900 text-justify mb-2.5"
              style={{
                fontFamily: "'Source Serif 4', 'Times New Roman', Georgia, serif",
                textRendering: 'optimizeLegibility',
              }}
            >
              {sec.content}
            </p>
          );
        }

        // Figure
        if (sec.type === 'figure' && sec.figure) {
          return (
            <JournalFigure
              key={sec.id || idx}
              figure={sec.figure}
              isFullWidth={sec.figure.isFullWidth}
            />
          );
        }

        // Table
        if (sec.type === 'table' && sec.table) {
          return (
            <JournalTable
              key={sec.id || idx}
              table={sec.table}
              isFullWidth={sec.table.isFullWidth}
            />
          );
        }

        return null;
      })}
    </div>
  );
};
