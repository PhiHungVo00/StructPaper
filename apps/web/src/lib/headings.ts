/**
 * Section numbers typed in Word ("4. Kết quả", "2.1. Mô hình", "3) …") are not printed by the journal
 * (headings are unnumbered, as in the reference PDF). They stay in the data, so turning "keep section
 * numbers" on brings them back for journals that do number their sections.
 */
const NUMBER_PREFIX = /^\s*(?:\d{1,2}(?:\.\d{1,2})+\.?|\d{1,2}[.)])\s+(?=\S)/;

export function stripHeadingNumber(title: string): string {
  return (title || '').replace(NUMBER_PREFIX, '');
}

export function displayHeading(title: string, keepNumbers: boolean): string {
  return keepNumbers ? title : stripHeadingNumber(title);
}
