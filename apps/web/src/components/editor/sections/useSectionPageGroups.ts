import { useMemo, useRef } from 'react';
import type { PaperSection } from '@/types/paper';
import { derivePageGroups, groupIndexById, type PageDefaults, type PageGroup } from '@/lib/editor/page-groups';
import type { PageGroupInfo } from './PageGroupHeader';

const sameInfo = (a: PageGroupInfo, b: PageGroupInfo) =>
  a.groupIndex === b.groupIndex &&
  a.groupTotal === b.groupTotal &&
  a.groupCount === b.groupCount &&
  a.columns === b.columns &&
  a.orientation === b.orientation &&
  a.explicit === b.explicit &&
  a.inheritsColumns === b.inheritsColumns &&
  a.inheritsOrientation === b.inheritsOrientation;

/**
 * Page groups of the paper for the content tab. Each group's info object keeps its identity while its
 * values do not change, so typing in one section does not re-render the cards of the other groups.
 */
export function useSectionPageGroups(sections: PaperSection[], defaults: PageDefaults) {
  const { oneColumn, landscape } = defaults;
  const groups = useMemo<PageGroup[]>(() => derivePageGroups(sections, { oneColumn, landscape }), [sections, oneColumn, landscape]);
  const previous = useRef<PageGroupInfo[]>([]);

  return useMemo(() => {
    const infos = groups.map((g) => {
      const info: PageGroupInfo = {
        groupIndex: g.index,
        groupTotal: groups.length,
        groupCount: g.count,
        columns: g.columns,
        orientation: g.orientation,
        explicit: g.explicit,
        inheritsColumns: g.inherits.columns,
        inheritsOrientation: g.inherits.orientation,
      };
      const old = previous.current[g.index];
      return old && sameInfo(old, info) ? old : info;
    });
    previous.current = infos;
    return {
      groups,
      infos,
      startIds: new Set(groups.map((g) => g.startId)),
      groupOf: groupIndexById(groups, sections),
    };
  }, [groups, sections]);
}
