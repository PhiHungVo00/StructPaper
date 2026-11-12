'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Minus, Plus, RectangleHorizontal, RectangleVertical } from 'lucide-react';
import { groupItemsIntoLines, lineAtPoint, type PdfLine, type PdfTextItem } from '@/lib/editor/pdf-section-map';

export interface PdfPickContext {
  lines: string[];
  center: number;
}

export interface PdfRotateContext {
  page: number;
  orientation: 'portrait' | 'landscape';
  lines: string[];
  prevLines: string[] | null;
  nextLines: string[] | null;
}

interface PdfInteractiveViewerProps {
  url: string;
  /** A click on text: the lines of that page and the index of the clicked line. */
  onPickText?: (ctx: PdfPickContext) => void;
  /** "Turn this page": the lines of the page and of the page after it. */
  onRotatePage?: (ctx: PdfRotateContext) => void;
  onLoadError?: () => void;
}

interface PageSize {
  w: number;
  h: number;
}
interface PageText {
  items: PdfTextItem[];
  lines: PdfLine[];
}
interface Hit {
  left: number;
  top: number;
  w: number;
  h: number;
}

/** The compiled PDF drawn with pdf.js so a click can be traced back to the editor and a page can be turned. */
export const PdfInteractiveViewer: React.FC<PdfInteractiveViewerProps> = ({ url, onPickText, onRotatePage, onLoadError }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageEls = useRef<(HTMLDivElement | null)[]>([]);
  const docRef = useRef<any>(null);
  const textCache = useRef<Map<number, PageText>>(new Map());
  const saved = useRef<{ page: number; frac: number }>({ page: 1, frac: 0 });
  const [sizes, setSizes] = useState<PageSize[]>([]);
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [current, setCurrent] = useState(1);
  const [hit, setHit] = useState<(Hit & { page: number }) | null>(null);

  const scaleOf = useCallback((i: number) => (sizes[i] ? ((width - 24) / sizes[i].w) * zoom : 1), [sizes, width, zoom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // load (and reload after a recompile, keeping the place the reader was at)
  // (a copy of the pane that is not on screen, width 0, does not load anything)
  const shown = width > 0;
  useEffect(() => {
    if (!shown) return;
    let dead = false;
    (async () => {
      try {
        const pdfjs: any = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        const data = await (await fetch(url)).arrayBuffer();
        const doc = await pdfjs.getDocument({ data }).promise;
        const dims: PageSize[] = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const v = (await doc.getPage(n)).getViewport({ scale: 1 });
          dims.push({ w: v.width, h: v.height });
        }
        if (dead) return;
        docRef.current = doc;
        textCache.current.clear();
        setHit(null);
        setSizes(dims);
      } catch {
        if (!dead) onLoadError?.();
      }
    })();
    return () => {
      dead = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, shown]);

  // only when a (re)loaded document gets its page boxes
  useLayoutEffect(() => {
    const el = pageEls.current[saved.current.page - 1];
    if (el && scrollRef.current && sizes.length) scrollRef.current.scrollTop = el.offsetTop + saved.current.frac * el.offsetHeight - 8;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizes]);

  const onScroll = useCallback(() => {
    const box = scrollRef.current;
    if (!box) return;
    const mid = box.scrollTop + box.clientHeight / 3;
    let page = 1;
    pageEls.current.forEach((el, i) => {
      if (el && el.offsetTop <= mid) page = i + 1;
    });
    const el = pageEls.current[page - 1];
    saved.current = { page, frac: el ? Math.max(0, (box.scrollTop - el.offsetTop) / Math.max(1, el.offsetHeight)) : 0 };
    setCurrent(page);
  }, []);

  const loadText = useCallback(async (n: number): Promise<PageText | null> => {
    const cached = textCache.current.get(n);
    if (cached) return cached;
    const doc = docRef.current;
    if (!doc) return null;
    const content = await (await doc.getPage(n)).getTextContent();
    const items: PdfTextItem[] = content.items.map((it: any) => ({
      str: it.str,
      x: it.transform[4],
      y: it.transform[5],
      width: it.width,
      height: it.height || Math.abs(it.transform[3]) || 10,
    }));
    const entry = { items, lines: groupItemsIntoLines(items) };
    textCache.current.set(n, entry);
    return entry;
  }, []);

  const handleClick = async (n: number, e: React.MouseEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const s = scaleOf(n - 1);
    const px = (e.clientX - box.left) / s;
    const py = sizes[n - 1].h - (e.clientY - box.top) / s;
    const text = await loadText(n);
    if (!text || !text.lines.length) return;
    const li = lineAtPoint(text.items, text.lines, px, py);
    if (li < 0) return;
    const ln = text.lines[li];
    const used = text.items.slice(ln.from, ln.to + 1).filter((it) => it.str);
    const x1 = Math.min(...used.map((it) => it.x));
    const x2 = Math.max(...used.map((it) => it.x + it.width));
    const top = Math.max(...used.map((it) => it.y + it.height));
    const bottom = Math.min(...used.map((it) => it.y)) - 2;
    setHit({ page: n, left: x1 * s - 3, top: (sizes[n - 1].h - top) * s - 2, w: (x2 - x1) * s + 6, h: (top - bottom) * s + 4 });
    onPickText?.({ lines: text.lines.map((l) => l.text), center: li });
  };

  const turn = async (orientation: 'portrait' | 'landscape') => {
    const here = await loadText(current);
    const next = current < sizes.length ? await loadText(current + 1) : null;
    const prev = current > 1 ? await loadText(current - 1) : null;
    if (!here) return;
    onRotatePage?.({
      page: current,
      orientation,
      lines: here.lines.map((l) => l.text),
      prevLines: prev ? prev.lines.map((l) => l.text) : null,
      nextLines: next ? next.lines.map((l) => l.text) : null,
    });
  };

  const landscape = !!sizes[current - 1] && sizes[current - 1].w > sizes[current - 1].h;

  return (
    <div className="w-full h-full flex flex-col min-h-0" data-testid="pdf-viewer">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-200 bg-white text-[11px] flex-shrink-0 flex-wrap">
        <span className="font-bold text-zinc-700" data-testid="pdf-page-indicator">
          Trang {current} / {sizes.length || '…'}
        </span>
        <div className="flex items-center gap-0.5">
          <button type="button" aria-label="Thu nhỏ" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))} className="p-1 rounded-lg hover:bg-zinc-100 cursor-pointer">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-9 text-center tabular-nums text-zinc-500">{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="Phóng to" onClick={() => setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)))} className="p-1 rounded-lg hover:bg-zinc-100 cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {onRotatePage && (
          <div className="ml-auto flex items-center gap-1" role="group" aria-label="Hướng giấy của trang đang xem">
            <span className="text-zinc-500 hidden sm:inline">Trang này:</span>
            {(['portrait', 'landscape'] as const).map((o) => {
              const on = (o === 'landscape') === landscape;
              const Icon = o === 'landscape' ? RectangleHorizontal : RectangleVertical;
              return (
                <button
                  key={o}
                  type="button"
                  data-testid={`pdf-turn-${o}`}
                  aria-pressed={on}
                  onClick={() => turn(o)}
                  title={o === 'landscape' ? 'Xoay trang đang xem thành khổ ngang' : 'Đưa trang đang xem về khổ dọc'}
                  className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer ${on ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {o === 'landscape' ? 'Ngang' : 'Dọc'}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-auto bg-zinc-200 py-2">
        {sizes.map((sz, i) => (
          <PdfPage
            key={`${url}-${i}`}
            index={i}
            size={sz}
            scale={scaleOf(i)}
            doc={docRef}
            hit={hit && hit.page === i + 1 ? hit : null}
            setRef={(el) => {
              pageEls.current[i] = el;
            }}
            onClick={onPickText ? (e) => handleClick(i + 1, e) : undefined}
          />
        ))}
      </div>
    </div>
  );
};

interface PdfPageProps {
  index: number;
  size: PageSize;
  scale: number;
  doc: React.MutableRefObject<any>;
  hit: Hit | null;
  setRef: (el: HTMLDivElement | null) => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const PdfPage: React.FC<PdfPageProps> = ({ index, size, scale, doc, hit, setRef, onClick }) => {
  const box = useRef<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setVisible(true), { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !canvas.current || !doc.current) return;
    let task: any;
    let dead = false;
    (async () => {
      const page = await doc.current.getPage(index + 1);
      if (dead || !canvas.current) return;
      const dpr = window.devicePixelRatio || 1;
      const vp = page.getViewport({ scale: scale * dpr });
      const c = canvas.current;
      c.width = Math.floor(vp.width);
      c.height = Math.floor(vp.height);
      const ctx = c.getContext('2d');
      if (!ctx) return;
      task = page.render({ canvasContext: ctx, viewport: vp });
      await task.promise.catch(() => undefined);
    })();
    return () => {
      dead = true;
      task?.cancel?.();
    };
  }, [visible, scale, index, doc]);

  return (
    <div
      ref={(el) => {
        box.current = el;
        setRef(el);
      }}
      data-testid={`pdf-page-${index + 1}`}
      onClick={onClick}
      className={`relative mx-auto mb-3 bg-white shadow-md ${onClick ? 'cursor-pointer' : ''}`}
      style={{ width: size.w * scale, height: size.h * scale }}
    >
      <canvas ref={canvas} style={{ width: '100%', height: '100%' }} />
      {hit && (
        <div
          data-testid="pdf-hit"
          className="absolute pointer-events-none rounded-sm"
          style={{ left: hit.left, top: hit.top, width: hit.w, height: hit.h, background: 'rgba(120,200,65,0.28)', outline: '1.5px solid #78C841' }}
        />
      )}
    </div>
  );
};
