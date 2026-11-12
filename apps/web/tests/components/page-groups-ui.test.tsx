// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    motion: new Proxy(actual.motion as Record<string, unknown>, {
      get: (_t, prop: string) => {
        const C = React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => {
          const El = prop as unknown as React.ElementType;
          for (const k of ['initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap', 'layoutId']) delete props[k];
          return <El ref={ref} {...props}>{children}</El>;
        });
        C.displayName = `Motion_${prop}`;
        return C;
      },
    }),
  };
});

import { SectionsTab } from '@/components/editor';
import type { PaperSection } from '@/types/paper';

afterEach(cleanup);

const meta: any = { title: 'T', authors: [], affiliations: [], keywords: [], dates: {} };
const para = (id: string, extra: Partial<PaperSection> = {}): PaperSection => ({ id, type: 'paragraph', content: `Nội dung ${id}`, ...extra });

const plain = [para('a'), para('b'), para('c')];
const grouped = [
  para('a'),
  para('b'),
  para('c', { pageLayout: { orientation: 'landscape' } }),
  para('d'),
  para('e', { pageLayout: { columns: '1-column' } }),
];

const renderTab = (sections: PaperSection[], over: Record<string, unknown> = {}) => {
  const onChange = vi.fn();
  const utils = render(<SectionsTab sections={sections} onChange={onChange} metadata={meta} references={[]} {...over} />);
  return { onChange, ...utils };
};

describe('page groups: one layout, one group', () => {
  it('without markers the paper is one group, with a hint instead of headers or rails', () => {
    renderTab(plain);
    expect(screen.queryAllByTestId('page-group-pill')).toHaveLength(0);
    expect(screen.getByTestId('page-group-overview').textContent).toContain('Toàn bộ nội dung cùng một bố cục (Dọc · 2 cột)');
    expect(screen.queryAllByTestId('page-group-header')).toHaveLength(0);
  });

  it('the overview has one chip per group with its layout and size, in document order', () => {
    renderTab(grouped);
    const pills = screen.getAllByTestId('page-group-pill');
    expect(pills.map((p) => p.textContent)).toEqual(['12 cột· 2 mục', '22 cột· 2 mục', '31 cột· 1 mục']);
    expect(pills[1].getAttribute('title')).toContain('Ngang · 2 cột');
    expect(pills[2].getAttribute('title')).toContain('Dọc · 1 cột');
  });

  it('shows a header above the first section of each group, with the layout that group really has', () => {
    renderTab(grouped);
    const headers = screen.getAllByTestId('page-group-header');
    expect(headers).toHaveLength(3);
    expect(headers[0].textContent).toContain('bố cục chung của tài liệu (Dọc · 2 cột)');
    expect(headers[1].textContent).toContain('Nhóm 2');
    expect(within(headers[1]).getByTestId('page-group-orient-landscape').getAttribute('aria-checked')).toBe('true');
    expect(within(headers[1]).getByTestId('page-group-cols-2').getAttribute('aria-checked')).toBe('true');
    expect(headers[2].textContent).toContain('hướng theo cài đặt chung');
  });

  it('a landscape document makes group 1 landscape, and the groups follow the defaults', () => {
    renderTab(grouped, { layoutDefaults: { oneColumn: true, landscape: true } });
    const headers = screen.getAllByTestId('page-group-header');
    expect(headers[0].textContent).toContain('Ngang · 1 cột');
    // the marker {columns: 1-column} keeps the landscape default
    expect(within(headers[2]).getByTestId('page-group-orient-landscape').getAttribute('aria-checked')).toBe('true');
    expect(within(headers[2]).getByTestId('page-group-cols-1').getAttribute('aria-checked')).toBe('true');
  });
});

describe('page groups: editing a group edits its marker', () => {
  const lastSections = (onChange: ReturnType<typeof vi.fn>): PaperSection[] => onChange.mock.calls[onChange.mock.calls.length - 1][0];

  it('changing the orientation of a group writes it on the first section of the group only', () => {
    const { onChange } = renderTab(grouped);
    const header = screen.getAllByTestId('page-group-header')[1];
    fireEvent.click(within(header).getByTestId('page-group-orient-portrait'));
    const out = lastSections(onChange);
    expect(out.find((s) => s.id === 'c')!.pageLayout).toEqual({ orientation: 'portrait' });
    expect(out.find((s) => s.id === 'd')!.pageLayout).toBeUndefined();
  });

  it('changing the columns keeps the other field of the marker', () => {
    const { onChange } = renderTab(grouped);
    fireEvent.click(within(screen.getAllByTestId('page-group-header')[1]).getByTestId('page-group-cols-1'));
    expect(lastSections(onChange).find((s) => s.id === 'c')!.pageLayout).toEqual({ orientation: 'landscape', columns: '1-column' });
  });

  it('"Gộp vào nhóm trên" removes the marker, so the group joins the one above', () => {
    const { onChange } = renderTab(grouped);
    fireEvent.click(within(screen.getAllByTestId('page-group-header')[1]).getByTestId('page-group-merge'));
    expect('pageLayout' in lastSections(onChange).find((s) => s.id === 'c')!).toBe(false);
  });

  it('"Theo cài đặt chung" keeps the new page but drops the own orientation and columns', () => {
    const { onChange } = renderTab(grouped);
    fireEvent.click(within(screen.getAllByTestId('page-group-header')[1]).getByTestId('page-group-reset'));
    expect(lastSections(onChange).find((s) => s.id === 'c')!.pageLayout).toEqual({});
  });

  it('"Tách nhóm trang" on a section starts a new group there (an empty marker)', () => {
    const { onChange } = renderTab(plain);
    const buttons = screen.getAllByTestId('page-group-split');
    expect(buttons).toHaveLength(3);
    fireEvent.click(buttons[1]);
    expect(lastSections(onChange).find((s) => s.id === 'b')!.pageLayout).toEqual({});
  });

  it('the split button is not offered on a section that already opens a group', () => {
    renderTab(grouped);
    expect(screen.getAllByTestId('page-group-split')).toHaveLength(3); // a, b, d: c and e carry markers
  });

  it('the old per-card layout popover and badge are replaced by the group controls', () => {
    renderTab(grouped);
    expect(screen.queryAllByTestId('page-layout-button')).toHaveLength(0);
    expect(screen.queryAllByTestId('page-layout-badge')).toHaveLength(0);
  });
});

describe('page groups: jumping and filtering', () => {
  it('clicking a chip while a filter is on goes back to "Tất cả" so the group can be shown', () => {
    const mixed: PaperSection[] = [
      para('a'),
      { id: 'e', type: 'equation', content: '', equation: { latex: 'a=b', numbered: true, num: 1 } },
      para('c', { pageLayout: { orientation: 'landscape' } }),
    ];
    renderTab(mixed);
    fireEvent.click(screen.getByTestId('filter-equation'));
    expect(screen.queryByText('Nội dung c')).toBeNull();
    fireEvent.click(screen.getAllByTestId('page-group-pill')[1]);
    expect(screen.getByText('Nội dung a')).toBeDefined(); // the full list is back
  });
});
