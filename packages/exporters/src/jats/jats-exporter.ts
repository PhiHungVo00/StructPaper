/**
 * JATS XML 1.3 Exporter for StructPaper v2
 *
 * Generates valid JATS XML conforming to NLM/NCBI JATS 1.3 DTD standard:
 * https://jats.nlm.nih.gov/archiving/1.3/
 */

import type {
  Affiliation,
  Author,
  BackMatterItem,
  Inline,
  Manuscript,
  Reference,
} from '@structpaper/doc-model';
import type { JournalProfile } from '@structpaper/journal-profiles';
import { inlinesToJats, type JatsInlineContext } from './jats-inlines';
import { sectionToJats } from './jats-blocks';
import { escapeXml, parseDateComponents } from './xml-utils';
import type { CslItem, CslName } from '../csl';

export interface JatsExportOptions {
  profile?: JournalProfile;
  dtdVersion?: string;
}

/**
 * Splits author name into surname and given-names.
 */
function splitAuthorName(fullName: string): {
  surname: string;
  givenNames: string;
} {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { surname: parts[0], givenNames: '' };
  }
  // For Vietnamese/Western naming conventions: last token as surname or first as surname
  const surname = parts[parts.length - 1];
  const givenNames = parts.slice(0, parts.length - 1).join(' ');
  return { surname, givenNames };
}

function renderContribAuthor(author: Author): string {
  const { surname, givenNames } = splitAuthorName(author.name);
  const correspAttr = author.isCorresponding ? ' corresp="yes"' : '';
  const lines: string[] = [
    `        <contrib contrib-type="author"${correspAttr}>`,
  ];

  if (author.orcid) {
    lines.push(
      `          <contrib-id contrib-id-type="orcid">${escapeXml(author.orcid)}</contrib-id>`
    );
  }

  lines.push('          <name>');
  lines.push(`            <surname>${escapeXml(surname)}</surname>`);
  if (givenNames) {
    lines.push(`            <given-names>${escapeXml(givenNames)}</given-names>`);
  }
  lines.push('          </name>');

  if (author.email) {
    lines.push(`          <email>${escapeXml(author.email)}</email>`);
  }

  for (const affId of author.affiliationIds || []) {
    lines.push(`          <xref ref-type="aff" rid="${escapeXml(affId)}" />`);
  }

  lines.push('        </contrib>');
  return lines.join('\n');
}

function renderAffiliation(aff: Affiliation): string {
  const lines: string[] = [`        <aff id="${escapeXml(aff.id)}">`];
  lines.push(
    `          <institution content-type="orgname">${escapeXml(aff.institution)}</institution>`
  );
  if (aff.department) {
    lines.push(
      `          <institution content-type="orgdiv">${escapeXml(aff.department)}</institution>`
    );
  }
  if (aff.city) {
    lines.push(
      `          <addr-line><city>${escapeXml(aff.city)}</city></addr-line>`
    );
  }
  if (aff.country) {
    lines.push(`          <country>${escapeXml(aff.country)}</country>`);
  }
  lines.push('        </aff>');
  return lines.join('\n');
}

function renderReference(ref: Reference): string {
  const csl = ref.csl as CslItem | undefined;
  const doi = ref.doi || csl?.DOI;
  const url = ref.url || csl?.URL;

  const lines: string[] = [`      <ref id="${escapeXml(ref.id)}">`];

  if (csl && (csl.title || csl.author)) {
    const pubType = csl.type || 'journal';
    lines.push(`        <element-citation publication-type="${escapeXml(pubType)}">`);

    if (csl.author && csl.author.length > 0) {
      lines.push('          <person-group person-group-type="author">');
      for (const a of csl.author) {
        lines.push('            <name>');
        lines.push(`              <surname>${escapeXml(a.family || a.literal || 'Unknown')}</surname>`);
        if (a.given) {
          lines.push(`              <given-names>${escapeXml(a.given)}</given-names>`);
        }
        lines.push('            </name>');
      }
      lines.push('          </person-group>');
    }

    if (csl.title) {
      lines.push(`          <article-title>${escapeXml(csl.title)}</article-title>`);
    }
    if (csl['container-title']) {
      lines.push(`          <source>${escapeXml(csl['container-title'])}</source>`);
    }

    const yearMatch = csl.issued?.['date-parts']?.[0]?.[0] || ref.raw.match(/\b(19|20)\d{2}\b/)?.[0];
    if (yearMatch) {
      lines.push(`          <year>${escapeXml(String(yearMatch))}</year>`);
    }
    if (csl.volume) {
      lines.push(`          <volume>${escapeXml(String(csl.volume))}</volume>`);
    }
    if (csl.issue) {
      lines.push(`          <issue>${escapeXml(String(csl.issue))}</issue>`);
    }
    if (csl.page) {
      const pageStr = String(csl.page);
      const [fpage, lpage] = pageStr.split(/[-–]/);
      lines.push(`          <fpage>${escapeXml(fpage.trim())}</fpage>`);
      if (lpage) {
        lines.push(`          <lpage>${escapeXml(lpage.trim())}</lpage>`);
      }
    }
    if (doi) {
      lines.push(`          <pub-id pub-id-type="doi">${escapeXml(doi)}</pub-id>`);
    }
    if (url) {
      lines.push(`          <ext-link ext-link-type="uri" xlink:href="${escapeXml(url)}">${escapeXml(url)}</ext-link>`);
    }
    lines.push('        </element-citation>');
  } else {
    // Fallback mixed-citation
    lines.push('        <mixed-citation>');
    lines.push(`          ${escapeXml(ref.raw)}`);
    if (doi) {
      lines.push(`          <pub-id pub-id-type="doi">${escapeXml(doi)}</pub-id>`);
    }
    lines.push('        </mixed-citation>');
  }

  lines.push('      </ref>');
  return lines.join('\n');
}

export class JatsExporter {
  public export(
    manuscript: Manuscript,
    options: JatsExportOptions = {}
  ): string {
    const { meta } = manuscript;
    const ctx: JatsInlineContext = {};
    const dtdVer = options.dtdVersion || '1.3';

    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving and Interchange DTD v1.3 20210610//EN" "https://jats.nlm.nih.gov/archiving/1.3/JATS-archivearticle1-3.dtd">',
      `<article xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:mml="http://www.w3.org/1998/Math/MathML" article-type="${escapeXml(manuscript.articleType || 'research-article')}" xml:lang="${escapeXml(manuscript.lang || 'vi')}" dtd-version="${dtdVer}">`,
      '  <front>',
      '    <journal-meta>',
      `      <journal-id journal-id-type="publisher-id">${escapeXml(manuscript.journalId || 'structpaper')}</journal-id>`,
      '      <journal-title-group>',
      `        <journal-title>${escapeXml(options.profile?.name || 'Tạp chí Phát triển Khoa học & Công nghệ')}</journal-title>`,
      '      </journal-title-group>',
      '      <publisher>',
      '        <publisher-name>VNU-HCM Press</publisher-name>',
      '      </publisher>',
      '    </journal-meta>',
      '    <article-meta>',
      `      <article-id pub-id-type="publisher-id">${escapeXml(manuscript.id)}</article-id>`,
    ];

    if (meta.doi) {
      lines.push(`      <article-id pub-id-type="doi">${escapeXml(meta.doi)}</article-id>`);
    }

    lines.push('      <title-group>');
    lines.push(`        <article-title>${inlinesToJats(meta.title, ctx)}</article-title>`);
    if (meta.translations?.en) {
      lines.push('        <trans-title-group xml:lang="en">');
      lines.push(`          <trans-title>${inlinesToJats(meta.translations.en as Inline[], ctx)}</trans-title>`);
      lines.push('        </trans-title-group>');
    }
    lines.push('      </title-group>');

    // Authors and Affiliations
    if ((meta.authors && meta.authors.length > 0) || (meta.affiliations && meta.affiliations.length > 0)) {
      lines.push('      <contrib-group>');
      for (const author of meta.authors || []) {
        lines.push(renderContribAuthor(author));
      }
      for (const aff of meta.affiliations || []) {
        lines.push(renderAffiliation(aff));
      }
      lines.push('      </contrib-group>');
    }

    // Dates
    const pubDate = parseDateComponents(meta.dates?.published || meta.dates?.accepted || meta.dates?.received);
    if (pubDate.year) {
      lines.push('      <pub-date publication-format="electronic" date-type="pub">');
      lines.push(`        <year>${pubDate.year}</year>`);
      if (pubDate.month) lines.push(`        <month>${pubDate.month}</month>`);
      if (pubDate.day) lines.push(`        <day>${pubDate.day}</day>`);
      lines.push('      </pub-date>');
    }

    if (meta.volume) lines.push(`      <volume>${escapeXml(meta.volume)}</volume>`);
    if (meta.issue) lines.push(`      <issue>${escapeXml(meta.issue)}</issue>`);
    if (meta.pages) {
      lines.push(`      <fpage>${meta.pages[0]}</fpage>`);
      lines.push(`      <lpage>${meta.pages[1]}</lpage>`);
    }

    // Abstract
    if (meta.abstract && meta.abstract.length > 0) {
      lines.push('      <abstract>');
      for (const para of meta.abstract) {
        lines.push(`        <p>${inlinesToJats(para, ctx)}</p>`);
      }
      lines.push('      </abstract>');
    }

    // Keywords
    if (meta.keywords && meta.keywords.length > 0) {
      lines.push('      <kwd-group kwd-group-type="author-keywords">');
      for (const kw of meta.keywords) {
        lines.push(`        <kwd>${escapeXml(kw)}</kwd>`);
      }
      lines.push('      </kwd-group>');
    }

    lines.push('    </article-meta>');
    lines.push('  </front>');

    // Body
    lines.push('  <body>');
    for (const sec of manuscript.body || []) {
      lines.push(sectionToJats(sec, ctx));
    }
    lines.push('  </body>');

    // Back
    lines.push('  <back>');
    for (const item of (manuscript.back || []) as BackMatterItem[]) {
      if (item && item.type) {
        lines.push(`    <sec sec-type="${escapeXml(item.type)}">`);
        if (item.title) {
          lines.push(`      <title>${inlinesToJats(item.title, ctx)}</title>`);
        }
        lines.push('    </sec>');
      }
    }

    if (manuscript.references && manuscript.references.length > 0) {
      lines.push('    <ref-list>');
      lines.push('      <title>Tài liệu tham khảo</title>');
      for (const ref of manuscript.references) {
        lines.push(renderReference(ref));
      }
      lines.push('    </ref-list>');
    }

    lines.push('  </back>');
    lines.push('</article>');

    return lines.join('\n');
  }
}
