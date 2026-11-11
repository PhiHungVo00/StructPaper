/**
 * Real 9pt body text without depending on any extra TeX package.
 *
 * The `article` class has no 9pt option (it silently falls back to 10pt). `extarticle` has one, but it
 * lives in the `extsizes` package, which a fresh MiKTeX downloads on first use (slow, needs network) and
 * a minimal offline TeX install may not have at all. These definitions are what `extsizes` does for 9pt,
 * written inline so every engine (MiKTeX, TeX Live, tectonic) compiles the same document offline.
 */
export const SIZE9_PREAMBLE = String.raw`
\makeatletter
\DeclareMathSizes{9}{9}{6.5}{5}
\renewcommand\normalsize{%
  \@setfontsize\normalsize{9}{11}%
  \abovedisplayskip 8\p@ \@plus2\p@ \@minus4\p@
  \abovedisplayshortskip \z@ \@plus3\p@
  \belowdisplayshortskip 4\p@ \@plus2\p@ \@minus2\p@
  \belowdisplayskip \abovedisplayskip
  \let\@listi\@listI}
\renewcommand\small{\@setfontsize\small{8}{9.5}%
  \abovedisplayskip 6\p@ \@plus2\p@ \@minus2\p@
  \belowdisplayskip \abovedisplayskip}
\renewcommand\footnotesize{\@setfontsize\footnotesize{7.5}{8.5}}
\renewcommand\scriptsize{\@setfontsize\scriptsize{6}{7}}
\renewcommand\tiny{\@setfontsize\tiny{5}{6}}
\renewcommand\large{\@setfontsize\large{10}{12}}
\renewcommand\Large{\@setfontsize\Large{12}{14}}
\renewcommand\LARGE{\@setfontsize\LARGE{14}{18}}
\renewcommand\huge{\@setfontsize\huge{17}{22}}
\renewcommand\Huge{\@setfontsize\Huge{20}{25}}
\AtBeginDocument{\normalsize}
\makeatother
`;
