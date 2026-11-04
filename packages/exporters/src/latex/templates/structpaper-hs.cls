\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{structpaper-hs}[2026/11/05 v2.0 StructPaper Health Sciences Document Class]

% Pass all undeclared options to article base class
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{article}}
\ProcessOptions\relax
\LoadClass[10pt,twocolumn]{article}

% --- Page Geometry & Layout ---
\RequirePackage{geometry}
\geometry{
  a4paper,
  margin=20mm,
  top=20mm,
  bottom=20mm,
  columnsep=6mm
}

% --- Typography & Vietnamese UTF-8 Fonts ---
\RequirePackage{fontspec}
\IfFontExistsTF{Times New Roman}{
  \setmainfont{Times New Roman}[
    BoldFont=Times New Roman Bold,
    ItalicFont=Times New Roman Italic,
    BoldItalicFont=Times New Roman Bold Italic
  ]
}{}
\IfFontExistsTF{Arial}{
  \setsansfont{Arial}[
    BoldFont=Arial Bold,
    ItalicFont=Arial Italic,
    BoldItalicFont=Arial Bold Italic
  ]
}{}
\IfFontExistsTF{Courier New}{
  \setmonofont{Courier New}
}{}

% --- Math, Graphics, Tables & Color Packages ---
\RequirePackage{amsmath, amssymb}
\RequirePackage{graphicx}
\RequirePackage{booktabs}
\RequirePackage{tabularx}
\RequirePackage{multirow}
\RequirePackage{caption}
\RequirePackage{xcolor}
\RequirePackage{enumitem}
\RequirePackage{fancyhdr}

% Brand palette (VNUHCM-HS cyan/blue)
\definecolor{spBrand}{RGB}{0, 112, 186}
\definecolor{spGray}{RGB}{100, 110, 120}
\definecolor{spLightBg}{RGB}{245, 248, 252}

% --- Caption Styling ---
\captionsetup[figure]{font={small,sf}, labelfont={bf,color=spBrand}, skip=6pt}
\captionsetup[table]{font={small,sf}, labelfont={bf,color=spBrand}, skip=4pt}

% --- Hyperlinks ---
\RequirePackage{hyperref}
\hypersetup{
  colorlinks=true,
  linkcolor=spBrand,
  citecolor=spBrand,
  urlcolor=spBrand,
  filecolor=spBrand
}

% --- Header & Footer Settings ---
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\footnotesize\sffamily\itshape\color{spGray}\@spJournal}
\fancyhead[R]{\footnotesize\sffamily\color{spBrand}\@spArticleType}
\fancyfoot[C]{\footnotesize\sffamily\thepage}
\renewcommand{\headrulewidth}{0.4pt}
\renewcommand{\footrulewidth}{0pt}

% --- Internal Metadata Storage ---
\newcommand{\@spTitle}{}
\newcommand{\@spTitleEn}{}
\newcommand{\@spAuthors}{}
\newcommand{\@spAffiliations}{}
\newcommand{\@spAbstract}{}
\newcommand{\@spAbstractEn}{}
\newcommand{\@spKeywords}{}
\newcommand{\@spKeywordsEn}{}
\newcommand{\@spDates}{}
\newcommand{\@spDoi}{}
\newcommand{\@spArticleType}{Bài báo nghiên cứu}
\newcommand{\@spJournal}{Tạp chí Phát triển KH\&CN - Khoa học Sức khỏe}

% --- Public Metadata Macros ---
\newcommand{\spTitle}[1]{\renewcommand{\@spTitle}{#1}}
\newcommand{\spTitleEn}[1]{\renewcommand{\@spTitleEn}{#1}}
\newcommand{\spAuthors}[1]{\renewcommand{\@spAuthors}{#1}}
\newcommand{\spAffiliations}[1]{\renewcommand{\@spAffiliations}{#1}}
\newcommand{\spAbstract}[1]{\renewcommand{\@spAbstract}{#1}}
\newcommand{\spAbstractEn}[1]{\renewcommand{\@spAbstractEn}{#1}}
\newcommand{\spKeywords}[1]{\renewcommand{\@spKeywords}{#1}}
\newcommand{\spKeywordsEn}[1]{\renewcommand{\@spKeywordsEn}{#1}}
\newcommand{\spDates}[1]{\renewcommand{\@spDates}{#1}}
\newcommand{\spDoi}[1]{\renewcommand{\@spDoi}{#1}}
\newcommand{\spArticleType}[1]{\renewcommand{\@spArticleType}{#1}}
\newcommand{\spJournal}[1]{\renewcommand{\@spJournal}{#1}}

% --- Title Block Layout ---
\newcommand{\@renderTitleBlock}{%
  \begingroup
    \raggedright
    \ifx\@spArticleType\@empty\else
      {\footnotesize\sffamily\bfseries\color{spBrand}\MakeUppercase{\@spArticleType}}\par\vspace{4pt}
    \fi
    {\LARGE\bfseries\sffamily\color{spBrand}\@spTitle\par}\vspace{6pt}
    \ifx\@spTitleEn\@empty\else
      {\large\itshape\color{spGray}\@spTitleEn\par}\vspace{8pt}
    \fi
    {\normalsize\bfseries\@spAuthors\par}\vspace{4pt}
    {\footnotesize\itshape\@spAffiliations\par}\vspace{6pt}
    \ifx\@spDates\@empty\else
      {\scriptsize\color{spGray}\@spDates\par}\vspace{4pt}
    \fi
    \ifx\@spDoi\@empty\else
      {\scriptsize\color{spGray}\textbf{DOI:} \href{https://doi.org/\@spDoi}{\@spDoi}\par}\vspace{4pt}
    \fi
    \vspace{4pt}\rule{\linewidth}{0.6pt}\vspace{6pt}
    \ifx\@spAbstract\@empty\else
      {\small
        \noindent\textbf{TÓM TẮT}\par\vspace{2pt}
        \@spAbstract\par\vspace{4pt}
        \ifx\@spKeywords\@empty\else
          \noindent\textbf{\textit{Từ khóa:}} \@spKeywords\par\vspace{6pt}
        \fi
      }
    \fi
    \ifx\@spAbstractEn\@empty\else
      {\small
        \noindent\textbf{ABSTRACT}\par\vspace{2pt}
        \@spAbstractEn\par\vspace{4pt}
        \ifx\@spKeywordsEn\@empty\else
          \noindent\textbf{\textit{Keywords:}} \@spKeywordsEn\par\vspace{6pt}
        \fi
      }
    \fi
    \vspace{2pt}\rule{\linewidth}{0.6pt}\vspace{10pt}
  \endgroup
}

% --- Make Title Command ---
\newcommand{\makeSPTitle}{%
  \if@twocolumn
    \twocolumn[{\@renderTitleBlock}]
  \else
    \@renderTitleBlock
  \fi
}

\renewcommand{\maketitle}{\makeSPTitle}

% --- Compact List Settings ---
\setlist{itemsep=1pt, topsep=2pt, parsep=0pt, partopsep=0pt}

\endinput
