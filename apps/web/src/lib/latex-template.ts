import JSZip from 'jszip';
import { CompletePaper, LayoutSettings, DEFAULT_LAYOUT_SETTINGS } from '@/types/paper';
import { getJournalTemplate } from './templates';

/**
 * Escapes characters that have special meaning in LaTeX, while safely preserving math equations
 */
export function escapeLatex(text: string): string {
  if (!text) return '';

  // Strip zero-width and invisible unicode characters
  let clean = text.replace(/[\u200B\u200C\u200D\uFEFF\u200E\u200F]/g, '');

  // Protect LaTeX math segments: $$...$$ and $...$
  const mathSegments: string[] = [];
  const textWithPlaceholders = clean.replace(/(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g, (match) => {
    mathSegments.push(match);
    return `___MATH_TOKEN_${mathSegments.length - 1}___`;
  });

  let escaped = textWithPlaceholders
    // Replace % with \%
    .replace(/(?<!\\)%/g, () => '\\%')
    // Replace & with \&
    .replace(/(?<!\\)&/g, () => '\\&')
    // Replace _ with \_
    .replace(/(?<!\\)_/g, () => '\\_')
    // Replace # with \#
    .replace(/(?<!\\)#/g, () => '\\#')
    // Greek characters outside math mode
    .replace(/β/g, '$\\beta$')
    .replace(/α/g, '$\\alpha$')
    .replace(/γ/g, '$\\gamma$')
    .replace(/δ/g, '$\\delta$')
    .replace(/λ/g, '$\\lambda$')
    .replace(/μ/g, '$\\mu$')
    .replace(/π/g, '$\\pi$')
    .replace(/σ/g, '$\\sigma$')
    .replace(/θ/g, '$\\theta$')
    // Common math symbols outside math mode
    .replace(/≥/g, '$\\ge$')
    .replace(/≤/g, '$\\le$')
    .replace(/≠/g, '$\\ne$')
    .replace(/±/g, '$\\pm$')
    .replace(/→/g, '$\\to$')
    .replace(/←/g, '$\\gets$')
    .replace(/↔/g, '$\\leftrightarrow$')
    .replace(/⇒/g, '$\\Rightarrow$')
    .replace(/≈/g, '$\\approx$')
    .replace(/°/g, '$^\\circ$');

  // Restore math blocks untouched
  mathSegments.forEach((math, idx) => {
    escaped = escaped.replace(`___MATH_TOKEN_${idx}___`, math);
  });

  return escaped;
}

/**
 * Converts inline citation brackets like [1] or [1, 2] to native LaTeX natbib citations
 */
function formatParagraphText(text: string): string {
  if (!text) return '';
  let escaped = escapeLatex(text);
  escaped = escaped.replace(/\[(\d+)\]/g, '\\unskip~\\cite{ref$1}');
  escaped = escaped.replace(/\[(\d+)\s*,\s*(\d+)\]/g, '\\unskip~\\cite{ref$1,ref$2}');
  escaped = escaped.replace(/\[(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\]/g, '\\unskip~\\cite{ref$1,ref$2,ref$3}');
  return escaped;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = (hex || '#003E88').replace('#', '');
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function formatJournalDate(dateStr?: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  const parts = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (parts) {
    const dd = parts[1].padStart(2, '0');
    const mm = parts[2].padStart(2, '0');
    const yyyy = parts[3];
    return `${dd}-${mm}-${yyyy}`;
  }
  const isoParts = trimmed.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (isoParts) {
    const yyyy = isoParts[1];
    const mm = isoParts[2].padStart(2, '0');
    const dd = isoParts[3].padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`;
  }
  return trimmed;
}

// Complete official preamble before metadata with safe fallback guards
const OFFICIAL_PREAMBLE_PART1: string = "\\documentclass[9pt,twocolumn]{article}\n\\makeatletter\\if@twocolumn\\PassOptionsToPackage{switch}{lineno}\\else\\fi\\makeatother\n\n%Publisher: Pharmacogn\n%Template Provided By: Typeset\n\n\\usepackage{amsmath,amsfonts,amssymb,balance,tabulary,graphicx,caption,fancyhdr}\n\\usepackage[utf8]{inputenc}\n\\usepackage[numbers,super,sort&compress]{natbib}\n\n\\renewcommand{\\bibnumfmt}[1]{\\color{titlecolor} #1.}\n\n\\usepackage{abstract,mdframed}\n\n\n\\usepackage[paperheight=11in,paperwidth=8.51in,margin=2cm,left=1.7cm,headsep=.2cm,right=1.3cm,top=1.8cm]{geometry}\n\\setlength{\\paperwidth}{8.51in}\n\\setlength{\\paperheight}{11in}\n\\ifx\\pdfpagewidth\\undefined\\else\\setlength{\\pdfpagewidth}{8.51in}\\setlength{\\pdfpageheight}{11in}\\fi\n\\renewenvironment{onecolabstract} {\\prolight\\trivlist\\item[] \\vspace*{-.65pc}\\textbf{\\sffamily\\fontsize{9pt}{10pt}\\color{titlecolor}\\selectfont \\absname }\\\\}{\\par\\noindent\\endtrivlist}\\setlength{\\columnsep}{1pc} \n\\linespread{1.13} \\date{}\n\\renewcommand{\\headrulewidth}{0pt}\n          \\usepackage{polyglossia}\n          \\PassOptionsToPackage{vietnamese}{babel}\n          \\def\\absname{TÓM TẮT }\n          \\def\\Correspondence{\\normalfont\\textbf{Liên hệ}}\n          \\def\\History{\\normalfont\\textbf{Lịch sử}}\n          \\def\\Received{Ngày nhận}\n          \\def\\Revised{Ngày sửa đổi}\n          \\def\\Accepted{Ngày chấp nhận}\n          \\def\\Published{Ngày đăng}\n          \\def\\Copyright{\\normalfont\\textbf{Bản quyền}}\n          \\def\\publishershortname{ĐHQG Tp.HCM}\n          \\def\\copyrighttext{Đây là bài báo công bố mở được phát hành theo các điều khoản của the Creative Commons Attribution 4.0 International license.}\n          \\def\\citetext{Trích dẫn bài báo này}\n          \\def\\figurenm{\\sffamily\\bfseries\\color{titlecolor}Hình}\n          \\def\\tablenm{\\sffamily\\bfseries\\color{titlecolor}Bảng}\n\n          \\renewcommand\\ttfamily\\prolight\n        \n\n%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n% Following additional macros are required to function some \n% functions which are not available in the class used.\n%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n\\usepackage{url,multirow,morefloats,floatflt,cancel,tfrupee}\n\\makeatletter\n\n\n\\AtBeginDocument{\\@ifpackageloaded{textcomp}{}{\\usepackage{textcomp}}}\n\\makeatother\n\\usepackage{colortbl}\n\\usepackage{xcolor}\n\\usepackage{pifont}\n\\usepackage[nointegrals]{wasysym}\n\\urlstyle{rm}\n\\makeatletter\n\n%%%For Table column width calculation.\n\\def\\mcWidth#1{\\csname TY@F#1\\endcsname+\\tabcolsep}\n\n%%Hacking center and right align for table\n\\def\\cAlignHack{\\rightskip\\@flushglue\\leftskip\\@flushglue\\parindent\\z@\\parfillskip\\z@skip}\n\\def\\rAlignHack{\\rightskip\\z@skip\\leftskip\\@flushglue \\parindent\\z@\\parfillskip\\z@skip}\n\n%Etal definition in references\n\\@ifundefined{etal}{\\def\\etal{\\textit{et~al}}}{}\n\n\n%\\if@twocolumn\\usepackage{dblfloatfix}\\fi\n\\usepackage{ifxetex}\n\\ifxetex\\else\\if@twocolumn\\@ifpackageloaded{stfloats}{}{\\usepackage{dblfloatfix}}\\fi\\fi\n\n\\AtBeginDocument{\n\\expandafter\\ifx\\csname eqalign\\endcsname\\relax\n\\def\\eqalign#1{\\null\\vcenter{\\def\\\\{\\cr}\\openup\\jot\\m@th\n  \\ialign{\\strut$\\displaystyle{##}$\\hfil&$\\displaystyle{{}##}$\\hfil\n      \\crcr#1\\crcr}}\\,}\n\\fi\n}\n\n%For fixing hardfail when unicode letters appear inside table with endfloat\n\\AtBeginDocument{%\n  \\@ifpackageloaded{endfloat}%\n   {\\renewcommand\\efloat@iwrite[1]{\\immediate\\expandafter\\protected@write\\csname efloat@post#1\\endcsname{}}}{\\newif\\ifefloat@tables}%\n}%\n\n\\def\\BreakURLText#1{\\@tfor\\brk@tempa:=#1\\do{\\brk@tempa\\hskip0pt}}\n\\let\\lt=<\n\\let\\gt=>\n\\def\\processVert{\\ifmmode|\\else\\textbar\\fi}\n\\let\\processvert\\processVert\n\n\\@ifundefined{subparagraph}{\n\\def\\subparagraph{\\@startsection{paragraph}{5}{2\\parindent}{0ex plus 0.1ex minus 0.1ex}%\n{0ex}{\\normalfont\\small\\itshape}}%\n}{}\n\n% These are now gobbled, so won't appear in the PDF.\n\\newcommand\\role[1]{\\unskip}\n\\newcommand\\aucollab[1]{\\unskip}\n  \n\\@ifundefined{tsGraphicsScaleX}{\\gdef\\tsGraphicsScaleX{1}}{}\n\\@ifundefined{tsGraphicsScaleY}{\\gdef\\tsGraphicsScaleY{.9}}{}\n% To automatically resize figures to fit inside the text area\n\\def\\checkGraphicsWidth{\\ifdim\\Gin@nat@width>\\linewidth\n\t\\tsGraphicsScaleX\\linewidth\\else\\Gin@nat@width\\fi}\n\n\\def\\checkGraphicsHeight{\\ifdim\\Gin@nat@height>.9\\textheight\n\t\\tsGraphicsScaleY\\textheight\\else\\Gin@nat@height\\fi}\n\n\\def\\fixFloatSize#1{}%\\@ifundefined{processdelayedfloats}{\\setbox0=\\hbox{\\includegraphics{#1}}\\ifnum\\wd0<\\columnwidth\\relax\\renewenvironment{figure*}{\\begin{figure}}{\\end{figure}}\\fi}{}}\n\\let\\ts@includegraphics\\includegraphics\n\n\\def\\inlinegraphic[#1]#2{{\\edef\\@tempa{#1}\\edef\\baseline@shift{\\ifx\\@tempa\\@empty0\\else#1\\fi}\\edef\\tempZ{\\the\\numexpr(\\numexpr(\\baseline@shift*\\f@size/100))}\\protect\\raisebox{\\tempZ pt}{\\ts@includegraphics{#2}}}}\n\n%\\renewcommand{\\includegraphics}[1]{\\ts@includegraphics[width=\\checkGraphicsWidth]{#1}}\n\\AtBeginDocument{\\def\\includegraphics{\\@ifnextchar[{\\ts@includegraphics}{\\ts@includegraphics[width=\\checkGraphicsWidth,height=\\checkGraphicsHeight,keepaspectratio]}}}\n\n\\DeclareMathAlphabet{\\mathpzc}{OT1}{pzc}{m}{it}\n\n\\def\\URL#1#2{\\@ifundefined{href}{#2}{\\href{#1}{#2}}}\n\n%%For url break\n\\def\\UrlOrds{\\do\\*\\do\\-\\do\\~\\do\\'\\do\\\"\\do\\-}%\n\\g@addto@macro{\\UrlBreaks}{\\UrlOrds}\n\n\n\n\\edef\\fntEncoding{\\f@encoding}\n\\def\\EUoneEnc{EU1}\n\\makeatother\n\\def\\floatpagefraction{0.8} \n\\def\\dblfloatpagefraction{0.8}\n\\def\\style#1#2{#2}\n\\def\\xxxguillemotleft{\\fontencoding{T1}\\selectfont\\guillemotleft}\n\\def\\xxxguillemotright{\\fontencoding{T1}\\selectfont\\guillemotright}\n\n\\newif\\ifmultipleabstract\\multipleabstractfalse%\n\\newenvironment{typesetAbstractGroup}{}{}%\n\n%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n\n\n\n\\definecolor{titlecolor}{RGB}{TITLE_COLOR_R, TITLE_COLOR_G, TITLE_COLOR_B}\n\n\\usepackage{alphalph}\n\\makeatletter\n\\newalphalph{\\alphmult}[mult]{\\@alph}{26}\n\\makeatother\n\\renewcommand{\\thefootnote}{{\\alphmult{\\value{footnote}}}}\n\n\n\\usepackage{everyshi}\n\n\\makeatletter\n\\@ifpackageloaded{lineno}{\\setlength{\\linenumbersep}{.35pc}}{}\n\\usepackage{mathptmx}\n  \\def\\beforepage#1{%\n    \\edef\\later@{ later@}%\n    \\write\\@auxout{%\n        \\string\\expandafter\\string\\gdef\\string\\csname\\later@\\the\\numexpr\\c@page\\endcsname{\\unexpanded{#1}}\n    }%\n    }\n\\EveryShipout{\\ifcsname later@\\the\\numexpr\\c@page+1\\endcsname\\csname later@\\the\\numexpr\\c@page+1\\endcsname\\fi}\n\\AtBeginDocument{\\ifcsname later@1\\endcsname\\csname later@1\\endcsname\\fi}\n\\makeatother\n\n\\setlength{\\bibsep}{0.0pt}\n\\usepackage{fontspec}\n\\usepackage{xeCJK}\n\n\\IfFontExistsTF{Microsoft YaHei}{\n  \\setCJKmainfont{Microsoft YaHei}[AutoFakeBold=true,AutoFakeSlant=true]\n  \\setCJKsansfont{Microsoft YaHei}[AutoFakeBold=true,AutoFakeSlant=true]\n  \\setCJKmonofont{Microsoft YaHei}\n}{\n  \\IfFontExistsTF{SimSun}{\n    \\setCJKmainfont{SimSun}[AutoFakeBold=true,AutoFakeSlant=true]\n    \\setCJKsansfont{SimHei}[AutoFakeBold=true,AutoFakeSlant=true]\n    \\setCJKmonofont{SimSun}\n  }{\n    \\IfFontExistsTF{PingFang SC}{\n      \\setCJKmainfont{PingFang SC}[AutoFakeBold=true,AutoFakeSlant=true]\n      \\setCJKsansfont{PingFang SC}[AutoFakeBold=true,AutoFakeSlant=true]\n      \\setCJKmonofont{PingFang SC}\n    }{\n      \\IfFontExistsTF{Noto Sans CJK SC}{\n        \\setCJKmainfont{Noto Sans CJK SC}[AutoFakeBold=true,AutoFakeSlant=true]\n        \\setCJKsansfont{Noto Sans CJK SC}[AutoFakeBold=true,AutoFakeSlant=true]\n        \\setCJKmonofont{Noto Sans CJK SC}\n      }{\n        \\IfFontExistsTF{WenQuanYi Micro Hei}{\n          \\setCJKmainfont{WenQuanYi Micro Hei}[AutoFakeBold=true,AutoFakeSlant=true]\n          \\setCJKsansfont{WenQuanYi Micro Hei}[AutoFakeBold=true,AutoFakeSlant=true]\n          \\setCJKmonofont{WenQuanYi Micro Hei}\n        }{}\n      }\n    }\n  }\n}\n\n%\\let\\oldcite=\\cite\n%\\renewcommand{\\cite}[1]{\\textcolor[RGB]{0,62,136}{\\oldcite{#1}}}\n\n\\usepackage[colorlinks=true,citecolor=titlecolor,urlcolor=titlecolor,linkcolor=titlecolor]{hyperref}\n\n  \\widowpenalty=10000 \n  \\clubpenalty=10000\n\n\n\\ifxetex\n  \\usepackage{letltxmacro}\n  \\setlength{\\XeTeXLinkMargin}{1pt}\n  \\LetLtxMacro\\SavedIncludeGraphics\\includegraphics\n  \\def\\includegraphics#1#{% #1 catches optional stuff (star/opt. arg.)\n    \\IncludeGraphicsAux{#1}%\n  }%\n  \\newcommand*{\\IncludeGraphicsAux}[2]{%\n    \\XeTeXLinkBox{%\n      \\SavedIncludeGraphics#1{#2}%\n    }%\n  }%\n\\fi\n\n\n\\IfFontExistsTF{MinionPro-Regular.otf}{%\n\\setmainfont{MinionPro-Regular.otf}[\nBoldFont=MinionPro-Bold.otf,\nItalicFont=MinionPro-It.otf,\nBoldItalicFont=MinionPro-BoldIt.otf]\n}{%\n\\IfFontExistsTF{Times New Roman}{%\n  \\setmainfont{Times New Roman}[\n    BoldFont=Times New Roman Bold,\n    ItalicFont=Times New Roman Italic,\n    BoldItalicFont=Times New Roman Bold Italic]\n}{%\n  \\setmainfont{Palatino Linotype}\n}%\n}\n\n\\IfFontExistsTF{MyriadPro-Regular.otf}{%\n\\setsansfont{MyriadPro-Regular.otf}[\nBoldFont=MyriadPro-Bold.otf,\nItalicFont=MyriadPro-It.otf,\nBoldItalicFont=MyriadPro-BoldIt.otf]\n}{%\n\\IfFontExistsTF{Calibri}{%\n  \\setsansfont{Calibri}[\n    BoldFont=Calibri Bold,\n    ItalicFont=Calibri Italic,\n    BoldItalicFont=Calibri Bold Italic]\n}{%\n  \\setsansfont{Arial}\n}%\n}\n\n\\IfFontExistsTF{UniversLTStd-Light.otf}{%\n\\setmonofont{UniversLTStd-Light.otf}[\nBoldFont=UniversLTStd-Bold.otf,\nItalicFont=UniversLTStd-ExObl.otf,\nBoldItalicFont=UniversLTStd-BlackObl.otf]\n}{%\n\\IfFontExistsTF{Calibri Light}{%\n  \\setmonofont{Calibri Light}[\n    BoldFont=Calibri,\n    ItalicFont=Calibri Light Italic,\n    BoldItalicFont=Calibri\n  ]\n}{%\n  \\setmonofont{Calibri}\n}%\n}\n\n\\IfFontExistsTF{MyriadPro-Light.otf}{%\n\\newfontfamily\\prolight{MyriadPro-Light.otf}[\nBoldFont=MyriadPro-Bold.otf,\nItalicFont=MyriadPro-LightIt.otf,\nBoldItalicFont=MyriadPro-BoldIt.otf\n]\n}{%\n\\IfFontExistsTF{Calibri Light}{%\n  \\newfontfamily\\prolight{Calibri Light}[\n    BoldFont=Calibri,\n    ItalicFont=Calibri Light Italic,\n    BoldItalicFont=Calibri\n  ]\n}{%\n  \\newfontfamily\\prolight{Calibri}\n}%\n}\n\n\\renewcommand\\ttfamily\\prolight\n\n\\definecolor{numbercolor}{RGB}{0, 62, 136}\n\n\n\\definecolor{tableheadrcolor}{RGB}{229, 229, 229}\n\n\\definecolor{unitednationsblue}{RGB}{231, 236, 247}\n\n\n\n      \n      \\makeatletter\\def\\oupIndent{1pt}\n\\IfFileExists{tabcaptionwidth.sty}{\\usepackage{tabcaptionwidth}}{\\providecommand{\\tabularWidth}{\\linewidth}}\n\\definecolor{ocre}{RGB}{243,102,25}\n\\captionsetup[table]{justification=raggedright,singlelinecheck=false,name={\\tablenm},skip=1.4pt,font={small,sf,bf}, width=\\tabularWidth}\n\\captionsetup[figure]{name={\\figurenm},skip=.8pc,font={small,sf,small}}\n\\usepackage{changepage}\n\n\\usepackage{ifthen,everypage}\n\\IfFileExists{size9-edited.clo}{\\input{size9-edited.clo}}{}\n      \\def\\author#1{\\gdef\\@author{\\hskip-\\dimexpr(\\tabcolsep)%\n      \\hskip\\oupIndent%\n      \\hspace*{-11.5pc}%\n      \\parbox{\\dimexpr\\textwidth-\\oupIndent+11.5pc}%\n      {\\fontsize{11pt}{12pt}\\selectfont\\sffamily\\color{titlecolor}\\raggedright#1}}}\n      \n      \\def\\title#1{\\gdef\\@title{\\if@twocolumn\\else\\vspace*{-.8pc}\\fi\\vspace{.5pc}\\hspace*{.2pc}\\sffamily\\fontsize{18pt}{19pt}\n      \\selectfont\n      \\bfseries%{\n      \\parbox{\\dimexpr(\\linewidth+3.9cm)}\n      {\\color{titlecolor}\\raggedright#1\\\\[-.5pc]}\n      }}\n\n      \\let\\@articleType\\@empty \\def\\articletype#1{\\gdef\\@articleType{\\bfseries{\\fontsize{12pt}{12pt}\\selectfont\\itshape#1}}}\n\n\\fancypagestyle{headings}{\\fancyhf{}\\renewcommand{\\headrulewidth}{.5pt}\n\\fancyhead[L]{\\hspace{-11.4pc}\\bfseries\\sffamily\\itshape\\fontsize{8.5pt}{10pt}\\selectfont \\actualjournal\\journalname\\space\\ifx\\cmYear\\empty\\the\\year\\else\\cmYear\\fi,\\space\\cmVolume(\\cmIssue):\\cmfirstpage-\\cmlastpage}\n\\fancyfoot[L]{\\color{titlecolor}\\bfseries\\sffamily\\ifthenelse{\\isodd{\\value{page}}}{}{\\thepage}}\n\\fancyfoot[R]{\\color{titlecolor}\\bfseries\\sffamily\\ifthenelse{\\isodd{\\value{page}}}{\\thepage}{}}\n}\n\\pagestyle{headings}\n  \n\\fancypagestyle{plain}{\\renewcommand{\\headrulewidth}{0pt}\\renewcommand{\\footrulewidth}{0pt}\\fancyhf{}\n\\fancyhead[R]{\\begin{minipage}[b]{.5\\textwidth}\n\\hfill\\underline{\\@articleType}\\hspace*{.2pc} \\\\[-25pt]\n\\end{minipage}}\n\\fancyhead[L]{\\begin{minipage}[t]{.5\\textwidth}\n\\hspace{-11.4pc}\\itshape\\bfseries\n\\sffamily{\\fontsize{8pt}{7pt}\\selectfont \\actualjournal\\journalname\\space\\ifx\\cmYear\\empty\\the\\year\\else\\cmYear\\fi,\\space\\cmVolume(\\cmIssue):\\cmfirstpage-\\cmlastpage\\\\[.25pc]\\hspace*{-11.48pc}\n\\IfFileExists{open-access.png}{\\includegraphics[scale=.0072,keepaspectratio]{open-access.png}}{}\\raisebox{0.4pc}{\\normalfont \\color{gray}{\\bfseries\\,Open Access Full Text Article}}\n\\hfill}\n\\end{minipage}}%\n\\fancyfoot[c]{%\n  \\normalfont\\footnotesize%\n  \\raisebox{-.4cm}[2pc]{%\n    \\colorbox{blue!15}{\\parbox[c][1.4\\height]{.99\\textwidth}{\\sffamily\\fontsize{9pt}{10pt}\\selectfont\\textbf{\\citetext :} \\citeauthor. \\citetitle. \\textit{Sci. Tech. Dev. J.\\journalabbv}\\space\\ifx\\cmYear\\empty\\the\\year\\else\\cmYear\\fi;\\space\\cmVolume(\\cmIssue):\\cmfirstpage-\\cmlastpage.}}}~\\\\[2pt]\\hfill\\normalsize\\bfseries\\sffamily\\color{titlecolor}\\thepage}\n      }%\n      \\fancyheadoffset[leh,roh]{0pt}\n\n\\definecolor{trueblue}{rgb}{0.42, 0.35, 0.8}\n\\makeatother\n\n\n\\usepackage[explicit,noindentafter]{titlesec}\n\\def\\NormalBaseline{\\def\\baselinestretch{1.1}}\n\\usepackage{textcase}\n\\titleformat{\\section}[hang]{\\NormalBaseline\\filright\\boldmath\\bfseries\\color{titlecolor}\\fontsize{12pt}{13pt}\\selectfont\\sffamily}\n{\\thesection.}\n{6pt}\n{\\MakeTextUppercase{#1}}\n[]\n\\titleformat{\\subsection}[hang]{\\NormalBaseline\\color{titlecolor}\\fontsize{10pt}{12pt}\\selectfont\\bfseries\\sffamily}\n{\\thesubsection.}\n{6pt}\n{{#1}}\n[]\n\\titleformat{\\subsubsection}[hang]{\\NormalBaseline\\bfseries\\itshape\\color{titlecolor}\\fontsize{10pt}{12pt}\\selectfont\\sffamily}\n{\\hspace{16pt}\\thesubsubsection}\n{6pt}\n{{#1}}\n[]\n\\titleformat{\\paragraph}[hang]{\\NormalBaseline\\itshape}\n{\\theparagraph}\n{6pt}\n{\\color{titlecolor}{#1}}\n[]\n\\titleformat{\\subparagraph}[runin]{\\NormalBaseline}\n{\\thesubparagraph}\n{6pt}\n{\\color{titlecolor}{#1}}\n[]\n\n\\titlespacing{\\section}{0pt}{.5\\baselineskip}{.3\\baselineskip}  \n\\titlespacing{\\subsection}{0pt}{.8\\baselineskip}{.2\\baselineskip}  \n\\titlespacing{\\subsubsection}{0pt}{.8\\baselineskip}{.2\\baselineskip}  \n\\titlespacing{\\paragraph}{0pt}{.8\\baselineskip}{2pt}\n\\titlespacing{\\subparagraph}{0pt}{.5\\baselineskip}{2pt}\n\n";
const OFFICIAL_PREAMBLE_PART2: string = "\\setlength{\\parindent}{0pt}\n\n  \\usepackage{textpos}\n\n\\makeatletter\n\\def\\@maketitle{%\n  \\newpage\n  \\null\n  \\vskip 2em%\n\\begin{textblock*}{4.4cm}(-4.8cm,-2.3cm)\n\\begin{minipage}[b][.93\\paperheight]{4.4cm}\n\\vfill\n\\usebox{\\temp}\n\\ifdim\\the\\fooa<200pt\n\\IfFileExists{logo-vnuhcmpress-color.png}{\\hspace*{1pc}\\includegraphics[width=3cm,height=2cm]{logo-vnuhcmpress-color.png}}{\\vspace*{1.15cm}}\n\\else\n\\vspace*{1.15cm}\n\\fi\n\\end{minipage}\n  \\end{textblock*}\n  \\let \\footnote \\thanks\n    \\hspace*{-5cm}\\parbox{\\linewidth}{\\LARGE \\@title \\par}%\n  \\begin{center}%\n    \\vskip 1.5em%\n    {\\large\n      \\lineskip .5em%\n      \\begin{tabular}[t]{c}%\n        \\@author\n      \\end{tabular}\\par}%\n    \\vskip 1em%\n    {\\large \\@date}%\n  \\end{center}%\n  \\par\n  \\vskip 1.5em}\n\n\\makeatother\n\\AtBeginDocument{\\usepackage{lastpage}}\n\\usepackage{enumitem}\n\\setlist{itemsep=-3pt}\n\n\n\\usepackage{float}\n\n\\makeatletter\n\\AtBeginDocument{\\@ifpackageloaded{rotating}{\\PassOptionsToPackage{figuresright}{rotating}}{\\usepackage[figuresright]{rotating}}\\setlength{\\rotFPtop}{0pt plus 1fil}\\setlength{\\rotFPbot}{0pt plus 1fil}}\n\\makeatother\n\n\\makeatletter\n \\AtBeginDocument{%\n  \\@ifpackagewith{endfloat}{figuresonly}\n  {\\DeclareDelayedFloatFlavor{sidewaysfigure}{figure}}%true\n  {\\@ifpackagewith{endfloat}{tablesonly}{\\DeclareDelayedFloatFlavor{sidewaystable}{table}\\DeclareDelayedFloatFlavor{longtable}{table}\\DeclareDelayedFloatFlavor{landscape}{table}}%true\n  {\\@ifpackageloaded{endfloat}{\\DeclareDelayedFloatFlavor{sidewaysfigure}{figure}\\DeclareDelayedFloatFlavor{sidewaystable}{table}\\DeclareDelayedFloatFlavor{longtable}{table}\\DeclareDelayedFloatFlavor{landscape}{table}}{}}%false\n  }%false\n  }\n\\makeatother\n\\IfFileExists{multirow-custom.sty}{\\usepackage{multirow-custom}}{}\n\\begin{document}";

// Official sidebox metadata structure
const OFFICIAL_SIDEBOX_TEMPLATE: string = "\\newsavebox{\\temp}\n        \\sbox{\\temp}{%\n        \\parbox{4.4cm}{%\n        %\\hrule \n        \\noindent\\hfil\\rule{4.4cm}{.5pt}\\hfil\n        \\gdef\\affbox{\\parbox{4.4cm}{\n        {~\\\\[.5pc]\\raggedright {\\fontsize{8pt}{8pt}\\selectfont\\itshape B{\\^{\\d{o}}} m{\\^o}n N{\\^{\\d{o}}}i - Khoa Y {\\textendash} Trường \\text{\\DJ}{\\d{a}}i h\\d{o}c Khoa h\\d{o}c Sức khỏe - \\text{\\DJ}{\\d{a}}i h\\d{o}c Quốc Gia Th\\`{a}nh phố Hồ Ch\\'{\\i} Minh\\\\[.5pc] }{\\ttfamily\\bfseries\\color{titlecolor}\\fontsize{7pt}{7pt}\\selectfont \\Correspondence}\\\\[.35pc]\n        {\\ttfamily\\fontsize{7pt}{8pt}\\selectfont\\textbf{\\prolight H\\`{a} {V{\\~{u}}}}, B{\\^{\\d{o}}} m{\\^o}n N{\\^{\\d{o}}}i - Khoa Y {\\textendash} Trường \\text{\\DJ}{\\d{a}}i h\\d{o}c Khoa h\\d{o}c Sức khỏe - \\text{\\DJ}{\\d{a}}i h\\d{o}c Quốc Gia Th\\`{a}nh phố Hồ Ch\\'{\\i} Minh\\\\[.35pc]Email: hvu@uhsvnu.edu.vn.\\\\[.3pc]}}}}\n\n\\newdimen\\fooa\n\\setbox0=\\hbox{\\affbox}\n\\fooa=\\ht0 \\advance\\fooa by \\dp0\n\\global\\fooa=\\fooa\n        \\affbox\n        \\\\[.5pc]\\raggedright%\n        \\gdef\\hiscopybox{\\parbox{4.4cm}{%\n\\gdef\\his{%\\raggedright\n        {\\ttfamily\\color{titlecolor}\\fontsize{7pt}{9pt}\\selectfont\\bfseries \\History}\\\\[-.1pc]\n{\\fontsize{8pt}{9pt}\\selectfont \\hspace{2pt}{\\color{titlecolor} $\\bullet$}\\ \\Received: \\ttfamily \\cmReceived\\\\}{\\fontsize{8pt}{9pt}\\selectfont \\hspace{2pt}{\\color{titlecolor} $\\bullet$}\\ \\Revised: \\ttfamily \\cmRevised\\\\}\n{\\fontsize{8pt}{9pt}\\selectfont \\hspace{2pt}{\\color{titlecolor}$\\bullet$}\\ \\Accepted: \\ttfamily \\cmAccepted\\\\}\n{\\fontsize{8pt}{9pt}\\selectfont \\hspace{2pt}{\\color{titlecolor}$\\bullet$}\\ \\Published: \\ttfamily \\cmPublished\\\\[.3pc]}\n{\\ttfamily\\color{titlecolor}\\fontsize{7pt}{9pt}\\selectfont\\bfseries DOI : }{\\fontsize{7pt}{7pt}\\selectfont\\bfseries \\cmDoi}\\\\[.8pc]\n\\IfFileExists{check-update.jpeg}{\\includegraphics[width=3.8cm,height=.8cm]{check-update.jpeg}\\\\[.8pc]}{\\vspace{.8pc}}}\n\\ifdim\\the\\fooa>200pt\\relax\\ifdim\\the\\fooa<265pt\\relax\\else\\his\\fi\\fi{\\raggedright\\fontsize{7pt}{9pt}\\selectfont{\\ttfamily\\color{titlecolor}\\bfseries \\Copyright\\\\[.1pc]}\\textcopyright\\ \\publishershortname. {\\ttfamily \\copyrighttext}\\\\[1pc]}\n\\ifdim\\the\\fooa>200pt\\IfFileExists{logo-vnuhcmpress-color.png}{\\hspace*{1pc}\\includegraphics[width=3cm,height=2cm]{logo-vnuhcmpress-color.png}}{}\\fi}}\n      \\newdimen\\foob\n\\setbox0=\\hbox{\\hiscopybox}\n\\global\\foob=\\ht0 \\advance\\foob by \\dp0\n\\AddEverypageHook{\n%\\settototalheight\\fooc{\\affbox}\n \\ifcsname dupcontnt\\endcsname%\n\\else\\ifdim\\the\\fooa>200pt\\ifnum\\thepage=2\n\\begin{textblock*}{\\textwidth}(-.8cm,-.15cm)\n\\begin{minipage}[b]{1.2\\textwidth}\n\\hiscopybox\n\\end{minipage}\n  \\end{textblock*}\\gdef\\dupcontnt{}\n\\fi\\fi\\fi\n}\n\\ifdim\\the\\fooa<265pt\\his\\fi\n\\ifdim\\the\\fooa<200pt\\hiscopybox\\fi\n\n    }}\n\n"

/**
 * Official LaTeX Template Generator for VNUHCM Scientific Journals.
 * Dynamically applies colors, headers, metadata, math, tables, and figures.
 */
export function generateFullJournalLatex(paper: CompletePaper, customSettings?: LayoutSettings): string {
  const { metadata, sections, references } = paper;
  const tmpl = getJournalTemplate(metadata.journalId);
  const rgb = hexToRgb(tmpl.color);

  const settings = customSettings || paper.layoutSettings || DEFAULT_LAYOUT_SETTINGS;
  const isOneColumn = settings.columnLayout === '1-column';

  let paperWidthStr = '8.51in';
  let paperHeightStr = '11in';
  if (settings.paperSize === 'a4') {
    paperWidthStr = '210mm';
    paperHeightStr = '297mm';
  } else if (settings.paperSize === 'letter') {
    paperWidthStr = '8.5in';
    paperHeightStr = '11in';
  } else if (settings.paperSize === 'b5') {
    paperWidthStr = '182mm';
    paperHeightStr = '257mm';
  }

  const docClassCols = isOneColumn ? 'onecolumn' : 'twocolumn';
  const fontSize = settings.fontSize || '9pt';
  const colSep = isOneColumn ? '1pc' : (settings.columnSep || '1pc');
  const lineSpread = settings.lineSpacing || '1.13';

  // Flexible Word-style Page Numbering configuration
  const pageNum = settings.pageNumbering || {
    enabled: true,
    position: 'bottom-alternating',
    format: 'arabic',
    startNumber: 1,
    suppressOnFirstPage: false,
    prefixText: '',
  };

  const pfxStr = pageNum.prefixText ? `${pageNum.prefixText} ` : '';
  let pageFormatCmd = '\\pagenumbering{arabic}';
  if (pageNum.format === 'roman-lower') pageFormatCmd = '\\pagenumbering{roman}';
  else if (pageNum.format === 'roman-upper') pageFormatCmd = '\\pagenumbering{Roman}';
  else if (pageNum.format === 'alpha-lower') pageFormatCmd = '\\pagenumbering{alph}';
  else if (pageNum.format === 'alpha-upper') pageFormatCmd = '\\pagenumbering{Alph}';
  else if (pageNum.format === 'hyphen') pageFormatCmd = '\\pagenumbering{arabic}\\renewcommand{\\thepage}{- \\arabic{page} -}';
  else if (pageNum.format === 'page-x-of-y') pageFormatCmd = '\\pagenumbering{arabic}\\renewcommand{\\thepage}{\\arabic{page} / \\pageref{LastPage}}';

  if (pfxStr && pageNum.format !== 'hyphen' && pageNum.format !== 'page-x-of-y') {
    pageFormatCmd += `\\let\\origthepage\\thepage\\renewcommand{\\thepage}{${pfxStr}\\origthepage}`;
  }

  const startPageCmd = `\\setcounter{page}{${Math.max(1, pageNum.startNumber || 1)}}`;

  let headingsFootHead = `\\fancyfoot[L]{\\color{titlecolor}\\bfseries\\sffamily\\ifthenelse{\\isodd{\\value{page}}}{}{\\thepage}}
\\fancyfoot[R]{\\color{titlecolor}\\bfseries\\sffamily\\ifthenelse{\\isodd{\\value{page}}}{\\thepage}{}}`;

  if (!pageNum.enabled) {
    headingsFootHead = '\\fancyfoot[L]{}\\fancyfoot[C]{}\\fancyfoot[R]{}';
    pageFormatCmd = '\\pagenumbering{gobble}';
  } else {
    switch (pageNum.position) {
      case 'bottom-center':
        headingsFootHead = '\\fancyfoot[L]{}\\fancyfoot[R]{}\\fancyfoot[C]{\\color{titlecolor}\\bfseries\\sffamily\\thepage}';
        break;
      case 'bottom-right':
        headingsFootHead = '\\fancyfoot[L]{}\\fancyfoot[C]{}\\fancyfoot[R]{\\color{titlecolor}\\bfseries\\sffamily\\thepage}';
        break;
      case 'bottom-left':
        headingsFootHead = '\\fancyfoot[R]{}\\fancyfoot[C]{}\\fancyfoot[L]{\\color{titlecolor}\\bfseries\\sffamily\\thepage}';
        break;
      case 'top-center':
        headingsFootHead = `\\fancyhead[C]{\\color{titlecolor}\\bfseries\\sffamily\\thepage}\\fancyfoot[L]{}\\fancyfoot[C]{}\\fancyfoot[R]{}`;
        break;
      case 'top-right':
        headingsFootHead = `\\fancyhead[R]{\\color{titlecolor}\\bfseries\\sffamily\\thepage}\\fancyfoot[L]{}\\fancyfoot[C]{}\\fancyfoot[R]{}`;
        break;
      case 'top-left':
        headingsFootHead = `\\fancyhead[L]{\\color{titlecolor}\\bfseries\\sffamily\\thepage}\\fancyfoot[L]{}\\fancyfoot[C]{}\\fancyfoot[R]{}`;
        break;
      case 'top-alternating':
        headingsFootHead = `\\fancyhead[R]{\\color{titlecolor}\\bfseries\\sffamily\\ifthenelse{\\isodd{\\value{page}}}{\\thepage}{}}\\fancyhead[L]{\\color{titlecolor}\\bfseries\\sffamily\\ifthenelse{\\isodd{\\value{page}}}{}{\\thepage}}\\fancyfoot[L]{}\\fancyfoot[C]{}\\fancyfoot[R]{}`;
        break;
      case 'bottom-alternating':
      default:
        headingsFootHead = `\\fancyfoot[L]{\\color{titlecolor}\\bfseries\\sffamily\\ifthenelse{\\isodd{\\value{page}}}{}{\\thepage}}\\fancyfoot[R]{\\color{titlecolor}\\bfseries\\sffamily\\ifthenelse{\\isodd{\\value{page}}}{\\thepage}{}}`;
        break;
    }
  }

  let preamblePart1 = OFFICIAL_PREAMBLE_PART1
    .replace('TITLE_COLOR_R', String(rgb.r))
    .replace('TITLE_COLOR_G', String(rgb.g))
    .replace('TITLE_COLOR_B', String(rgb.b))
    .replace('\\documentclass[9pt,twocolumn]{article}', `\\documentclass[${fontSize},${docClassCols}]{article}`)
    .replace('paperheight=11in,paperwidth=8.51in', `paperheight=${paperHeightStr},paperwidth=${paperWidthStr}`)
    .replace('\\setlength{\\paperwidth}{8.51in}', `\\setlength{\\paperwidth}{${paperWidthStr}}`)
    .replace('\\setlength{\\paperheight}{11in}', `\\setlength{\\paperheight}{${paperHeightStr}}`)
    .replace('\\setlength{\\pdfpagewidth}{8.51in}\\setlength{\\pdfpageheight}{11in}', `\\setlength{\\pdfpagewidth}{${paperWidthStr}}\\setlength{\\pdfpageheight}{${paperHeightStr}}`)
    .replace('\\setlength{\\columnsep}{1pc}', `\\setlength{\\columnsep}{${colSep}}`)
    .replace('\\linespread{1.13}', `\\linespread{${lineSpread}}`)
    .replace(
      `\\fancyfoot[L]{\\color{titlecolor}\\bfseries\\sffamily\\ifthenelse{\\isodd{\\value{page}}}{}{\\thepage}}\n\\fancyfoot[R]{\\color{titlecolor}\\bfseries\\sffamily\\ifthenelse{\\isodd{\\value{page}}}{\\thepage}{}}`,
      headingsFootHead
    );

  // If page numbering is disabled or suppressed on the first page
  if (!pageNum.enabled || pageNum.suppressOnFirstPage) {
    preamblePart1 = preamblePart1.replace(
      '\\hfill\\normalsize\\bfseries\\sffamily\\color{titlecolor}\\thepage',
      ''
    );
  }

  // Inject page numbering format and startNumber at end of preamble
  preamblePart1 += `\n${pageFormatCmd}\n${startPageCmd}\n`;

  const safeTitle = (metadata.title || '').trim() || 'TIÊU ĐỀ BÀI BÁO (BẢN THẢO)';
  const safeAbstract = (metadata.abstract || '').trim() || 'Tóm tắt bài báo chưa được nhập. Vui lòng cập nhật tóm tắt tại mục Tóm tắt để hoàn thiện bản thảo.';
  const safeKeywords = metadata.keywords && metadata.keywords.filter((k) => k.trim()).length > 0
    ? metadata.keywords.filter((k) => k.trim())
    : ['Bản thảo', 'Từ khóa'];

  const rawAuthors = metadata.authors && metadata.authors.length > 0
    ? metadata.authors
    : [{ id: 'a_default', name: 'Nhóm Tác giả', affiliationIds: [1] }];

  const rawAffiliations = metadata.affiliations && metadata.affiliations.length > 0
    ? metadata.affiliations
    : [{ id: 1, name: 'Đại học Quốc gia Thành phố Hồ Chí Minh' }];

  const citeAuthors = rawAuthors
    .map((a) => {
      const parts = (a.name || 'Tác giả').trim().split(/\s+/);
      const last = parts.pop() || '';
      const initials = parts.map((p) => p[0]).join(' ');
      return `${last} ${initials}`.trim();
    })
    .join(', ');

  const hasMultipleAffs = rawAffiliations.length > 1;
  const authorsFormatted = rawAuthors
    .map((a) => {
      const affMark = hasMultipleAffs && a.affiliationIds && a.affiliationIds.length > 0
        ? a.affiliationIds.join(',')
        : '';
      const corrMark = a.isCorresponding ? '*' : '';
      const supContent = `${affMark}${affMark && corrMark ? ',' : ''}${corrMark}`;
      const sup = supContent ? `\\textsuperscript{${supContent}}\\!` : '';
      const nameWithTildes = (a.name || 'Tác giả').trim().replace(/\s+/g, '~');
      return `${escapeLatex(nameWithTildes)}${sup}`;
    })
    .join(', ');

  const affiliationsFormatted = rawAffiliations
    .map((aff) => {
      const prefix = hasMultipleAffs && aff.id ? `\\textsuperscript{${aff.id}}` : '';
      const lines: string[] = [];
      if (aff.name && aff.name.trim()) {
        lines.push(`${prefix}${escapeLatex(aff.name.trim())}`);
      }
      if (aff.nameEn && aff.nameEn.trim()) {
        lines.push(`${prefix}${escapeLatex(aff.nameEn.trim())}`);
      }
      if (lines.length === 0) {
        lines.push(`${prefix}Đại học Quốc gia Thành phố Hồ Chí Minh`);
      }
      return lines.join('\\\\[.15pc]\n');
    })
    .join('\\\\[.35pc]\n');

  const corrAuthorObj = rawAuthors.find((a) => a.isCorresponding);
  const corrName = escapeLatex(metadata.corresponding?.name || corrAuthorObj?.name || rawAuthors[0]?.name || 'Tác giả liên hệ');
  const corrAff = escapeLatex(metadata.corresponding?.affiliation || rawAffiliations[0]?.name || 'Đại học Quốc gia TP.HCM');
  const corrEmail = escapeLatex((metadata.corresponding?.email || corrAuthorObj?.email || rawAuthors[0]?.email || 'tacgia@vnuhcm.edu.vn').replace(/\.+$/, ''));

  const mainJournalName = 'Tạp chí Phát triển Khoa học và Công nghệ';
  const subSeriesName = tmpl.name.replace(/^Tạp chí Phát triển (Khoa học &|KH&CN|Khoa học và) Công nghệ\s*[–-]?\s*/i, '').trim();
  const journalSuffix = subSeriesName ? ` -- ${subSeriesName}` : '';

  const rawAbbv = metadata.journalAbbv || tmpl.shortName;
  const subAbbv = rawAbbv.replace(/^Sci\.\s*Tech\.\s*Dev\.\s*J\.?\s*/i, '').trim();
  const formattedAbbv = subAbbv ? ` - ${subAbbv.replace(/^-\s*/, '')}` : '';

  const metaBlock = `\\def\\cmDoi{${escapeLatex(metadata.doi || `https://doi.org/10.32508/${tmpl.id.toLowerCase()}.v${metadata.volume || '1'}i${metadata.issue || '1'}`)}}
\\def\\cmVolume{${metadata.volume || '1'}}
\\def\\cmIssue{${metadata.issue || '1'}}
\\def\\cmMonth{}
\\def\\cmYear{${metadata.year || new Date().getFullYear().toString()}}
\\def\\journalabbv{${escapeLatex(formattedAbbv)}}

\\def\\cmReceived{${escapeLatex(formatJournalDate(metadata.dates?.received) || '14-06-2025')}}
\\def\\cmRevised{${escapeLatex(formatJournalDate(metadata.dates?.revised) || '10-02-2026')}}
\\def\\cmAccepted{${escapeLatex(formatJournalDate(metadata.dates?.accepted) || '14-04-2026')}}
\\def\\cmPublished{${escapeLatex(formatJournalDate(metadata.dates?.published) || '07-05-2026')}}
\\def\\cmfirstpage{${metadata.firstPage || 1}}
\\def\\cmlastpage{${metadata.lastPage || 10}}
\\def\\citeauthor{${escapeLatex(citeAuthors)}}
\\def\\citetitle{\\textbf{${escapeLatex(safeTitle)}}}\\def\\journalname{${escapeLatex(journalSuffix)}}\\def\\actualjournal{${escapeLatex(mainJournalName)}}\\renewcommand{\\refname}{Tài liệu tham khảo}
`;

  const dynamicAffbox = `        \\gdef\\affbox{\\parbox{4.4cm}{
        {~\\\\[.5pc]\\raggedright {\\fontsize{8pt}{8pt}\\selectfont\\itshape ${affiliationsFormatted}\\\\[.5pc]} }{\\ttfamily\\bfseries\\color{titlecolor}\\fontsize{7pt}{7pt}\\selectfont \\Correspondence}\\\\[.35pc]
        {\\ttfamily\\fontsize{7pt}{8pt}\\selectfont\\textbf{\\prolight ${corrName}}, ${corrAff}\\\\[.35pc]Email: ${corrEmail}.\\\\[.3pc]}}}`;

  const sidebox = OFFICIAL_SIDEBOX_TEMPLATE.replace(
    /\\gdef\\affbox\{[\s\S]*?\\newdimen\\fooa/,
    `${dynamicAffbox}\n\n\\newdimen\\fooa`
  );

  const titleBlock = `\n\n\\articletype{${escapeLatex(metadata.articleType || 'Bài nghiên cứu')}}
\\title{${escapeLatex(safeTitle)}}
\\author{{\\bfseries\\sffamily ${authorsFormatted}}}

${sidebox}
\\newgeometry{left=15.4pc,right=3.1pc,footskip=0cm,bottom=3.4cm,paperheight=${paperHeightStr},paperwidth=${paperWidthStr},headsep=.2cm,top=1.8cm}    
${isOneColumn
  ? `\\onecolumn \\maketitle {\\vspace*{-1pc}\\begin{mdframed}[innerrightmargin=1pc,innerleftmargin=1pc,innertopmargin=1pc,backgroundcolor=unitednationsblue,hidealllines=true]\\begin{textblock*}{.3\\textwidth}(-5cm,0cm)\\begin{center}\\vspace*{-1.15pc} \\hspace*{-.75pc}\\IfFileExists{qr-code.png}{\\includegraphics[scale=.014]{qr-code}}{\\IfFileExists{article-qr.png}{\\includegraphics[scale=.014]{article-qr}}{\\vspace*{1.5cm}}}\\\\\n\\vspace*{-.35pc}{\\fontsize{8pt}{9pt}\\selectfont\\hspace*{-.75pc}\\color{gray}{Use your smartphone to scan~this}\\\\\n\\vspace*{-.15pc}\\hspace*{-.75pc}\\color{gray}{QR code and download this article}}\\end{center}\\end{textblock*}\\begin{onecolabstract}\\def\\baselinestretch{1.06}\\fontsize{9.5pt}{9.5pt}\\selectfont ${escapeLatex(safeAbstract)}\\def\\keywordstitle{Keywords}

\\noindent\\prolight\\textbf{Từ khoá: }{${escapeLatex(safeKeywords.join(', '))}.\\newline}\\end{onecolabstract}\\end{mdframed}}\\vspace*{.8pc}\\saythanks \\baselineskip=\\the\\baselineskip plus.5pt minus.5pt`
  : `\\twocolumn[ \\maketitle {\\vspace*{-1pc}\\begin{mdframed}[innerrightmargin=1pc,innerleftmargin=1pc,innertopmargin=1pc,backgroundcolor=unitednationsblue,hidealllines=true]\\begin{textblock*}{.3\\textwidth}(-5cm,0cm)\\begin{center}\\vspace*{-1.15pc} \\hspace*{-.75pc}\\IfFileExists{qr-code.png}{\\includegraphics[scale=.014]{qr-code}}{\\IfFileExists{article-qr.png}{\\includegraphics[scale=.014]{article-qr}}{\\vspace*{1.5cm}}}\\\\\n\\vspace*{-.35pc}{\\fontsize{8pt}{9pt}\\selectfont\\hspace*{-.75pc}\\color{gray}{Use your smartphone to scan~this}\\\\\n\\vspace*{-.15pc}\\hspace*{-.75pc}\\color{gray}{QR code and download this article}}\\end{center}\\end{textblock*}\\begin{onecolabstract}\\def\\baselinestretch{1.06}\\fontsize{9.5pt}{9.5pt}\\selectfont ${escapeLatex(safeAbstract)}\\def\\keywordstitle{Keywords}

\\noindent\\prolight\\textbf{Từ khoá: }{${escapeLatex(safeKeywords.join(', '))}.\\newline}\\end{onecolabstract}\\end{mdframed}}\\vspace*{.8pc}]\\saythanks \\baselineskip=\\the\\baselineskip plus.5pt minus.5pt`}

`;

  let bodyLatex = '';
  sections.forEach((sec, secIdx) => {
    const title = sec.title?.trim() || '';
    const content = sec.content?.trim() || '';
    // Skip stray metadata sections or paragraphs
    if (/^(liên hệ|lịch sử|bản quyền|copyright|trích dẫn bài báo này|open access|article type)/i.test(title)) return;
    if (/©\s*ĐHQG|Creative Commons|hvu@uhsvnu|tạp chí phát triển/i.test(title)) return;
    if (sec.type === 'paragraph') {
      if (/©\s*ĐHQG|Creative Commons|Use your smartphone/i.test(content)) return;
      if (/^(email:|doi:|lịch sử|ngày nhận)/i.test(content)) return;
      if (/^(không steroid|thuốc ức chế)/i.test(content) && content.length < 80) return;
      if (rawAuthors.some((a) => a.name === content || (content.includes(a.name) && content.length < 80))) return;
    }

    if (sec.type === 'h1' && sec.title) {
      const displayTitle = sec.title.toUpperCase().replace(/TÁ\s+TRÀNG/g, 'TÁ~TRÀNG');
      bodyLatex += `\n\\section*\n  {\\textbf{${escapeLatex(displayTitle)}}}\n`;
      if (sec.content) bodyLatex += `${formatParagraphText(sec.content)}\n`;
    } else if (sec.type === 'h2' && sec.title) {
      bodyLatex += `\n\\subsection*\n  {\\textbf{${escapeLatex(sec.title)}}}\n`;
      if (sec.content) bodyLatex += `${formatParagraphText(sec.content)}\n`;
    } else if (sec.type === 'h3' && sec.title) {
      bodyLatex += `\n\\subsubsection*\n  {\\textbf{${escapeLatex(sec.title)}}}\n`;
      if (sec.content) bodyLatex += `${formatParagraphText(sec.content)}\n`;
    } else if (sec.type === 'paragraph' && sec.content) {
      bodyLatex += `\n${formatParagraphText(sec.content)}\n`;
    } else if (sec.type === 'citation' && sec.content) {
      bodyLatex += `\n\\begin{mdframed}[backgroundcolor=unitednationsblue,linecolor=journalBlue,linewidth=0.5pt,innerleftmargin=0.8pc,innerrightmargin=0.8pc,innertopmargin=0.5pc,innerbottommargin=0.5pc]
{\\footnotesize\\textbf{\\color{journalBlue}Trích dẫn bài báo này: }\\textit{${escapeLatex(sec.content)}}}
\\end{mdframed}\n`;
    } else if (sec.type === 'figure' && sec.figure) {
      const figNum = sec.figure.num || (secIdx + 1);
      let imgName = `fig${figNum}.png`;
      if (sec.figure.src) {
        if (sec.figure.src.startsWith('data:image')) {
          const isJpg = sec.figure.src.startsWith('data:image/jpeg') || sec.figure.src.startsWith('data:image/jpg');
          imgName = `fig${figNum}.${isJpg ? 'jpg' : 'png'}`;
        } else {
          imgName = sec.figure.src.split('/').pop() || `fig${figNum}.png`;
        }
      }

      // Column layout for figure: 1-column vs 2-column
      const isFigOneCol = isOneColumn || sec.figure.columnSpan === '1-column' || sec.figure.isFullWidth === false;
      const figEnv = isFigOneCol ? 'figure' : 'figure*';

      // Placement: auto -> !htbp, top -> t, here -> !h, bottom -> b
      let placement = '!htbp';
      if (sec.figure.placement === 'top') placement = 't';
      else if (sec.figure.placement === 'here') placement = '!h';
      else if (sec.figure.placement === 'bottom') placement = 'b';

      // Scale
      const scalePct = sec.figure.scalePercent || 100;
      const widthFactor = (scalePct / 100).toFixed(2);
      const widthArg = `width=${widthFactor}\\linewidth`;

      // Frame / Background
      const hasBorder = sec.figure.hasBorder !== false;
      const mdframedStart = hasBorder
        ? `\\begin{mdframed}[backgroundcolor=unitednationsblue,hidealllines=true]\n`
        : '';
      const mdframedEnd = hasBorder ? `\\end{mdframed}` : '';

      bodyLatex += `\n\\bgroup
\\fixFloatSize{images/${imgName}}
\\begin{${figEnv}}[${placement}]${mdframedStart}\\centering \\makeatletter
\\IfFileExists{images/${imgName}}{\\includegraphics[${widthArg}]{images/${imgName}}}{%
\\IfFileExists{${imgName}}{\\includegraphics[${widthArg}]{${imgName}}}{%
\\IfFileExists{images/fig${figNum}.png}{\\includegraphics[${widthArg}]{images/fig${figNum}.png}}{%
\\IfFileExists{fig${figNum}.png}{\\includegraphics[${widthArg}]{fig${figNum}.png}}{%
\\IfFileExists{images/fig${figNum}.jpg}{\\includegraphics[${widthArg}]{images/fig${figNum}.jpg}}{%
\\IfFileExists{fig${figNum}.jpg}{\\includegraphics[${widthArg}]{fig${figNum}.jpg}}{%
\\IfFileExists{open-access.png}{\\includegraphics[width=0.65\\linewidth]{open-access.png}}{\\rule{5cm}{3cm}}%
}}}}}}
\\makeatother 
\\caption{{\\textbf{${escapeLatex(sec.figure.caption)}}}}
${sec.figure.source ? `\\vspace{-0.3em}\\centering{\\footnotesize\\textit{${escapeLatex(sec.figure.source)}}}\\\\\n` : ''}\\label{figure-${figNum}}${mdframedEnd}
\\end{${figEnv}}
\\egroup\n`;
    } else if (sec.type === 'table' && sec.table) {
      const rawHeaders = sec.table.headers && sec.table.headers.length > 0 ? sec.table.headers : ['Cột 1'];
      const rawRows = sec.table.rows || [];
      const maxCols = Math.max(rawHeaders.length, ...rawRows.map((r) => r.length), 1);
      const colFmt = Array(maxCols).fill('L').join('');
      const headers = Array(maxCols).fill('').map((_, idx) => rawHeaders[idx] || '');
      const paddedRows = rawRows.map((row) => Array(maxCols).fill('').map((_, idx) => row[idx] || ''));

      // Check rotated vs 1-col vs 2-col
      const isRotated = !!sec.table.isRotated;
      const isTabOneCol = isOneColumn || sec.table.columnSpan === '1-column' || sec.table.isFullWidth === false;
      const tabEnv = isRotated
        ? (isTabOneCol ? 'sidewaystable' : 'sidewaystable*')
        : (isTabOneCol ? 'table' : 'table*');

      let placement = '!htbp';
      if (sec.table.placement === 'top') placement = 't';
      else if (sec.table.placement === 'here') placement = '!h';
      else if (sec.table.placement === 'bottom') placement = 'b';

      const tblFontSize = sec.table.fontSize || '8pt';
      const tblLineHeight = tblFontSize === '7pt' ? '9pt' : tblFontSize === '9pt' ? '11pt' : tblFontSize === '10pt' ? '12pt' : '10pt';
      const tblArrayStretch = sec.table.rowStretch || 1.4;
      const hasZebra = sec.table.hasZebraStripes !== false;

      bodyLatex += `\n\\begin{${tabEnv}}[${placement}]
\\caption{{\\textbf{${escapeLatex(sec.table.caption)}}}}
\\label{tab:${sec.table.num || 1}}
\\centering
{\\fontsize{${tblFontSize}}{${tblLineHeight}}\\selectfont
\\def\\arraystretch{${tblArrayStretch}}
\\begin{tabulary}{\\linewidth}{${colFmt}}
\\hline \\rowcolor{tableheadrcolor}
${headers.map((h) => `\\textbf{${escapeLatex(h)}}`).join(' & ')} \\\\ \\hline
${(sec.table.bodyRows && sec.table.bodyRows.length > 0
            ? sec.table.bodyRows
            : paddedRows.map((r) => r.map((c) => ({ text: c }))))
            .map(
              (row, rI) =>
                `${hasZebra && rI % 2 === 0 ? '\\rowcolor{unitednationsblue}\n' : ''}${row
                  .map((cell: any) => {
                    const rawText = cell.text !== undefined ? cell.text : String(cell || '');
                    let escaped = escapeLatex(rawText);
                    escaped = escaped.replace(/•/g, '$\\bullet$~');
                    escaped = escaped.replace(/\r?\n/g, ' \\newline ');
                    if (cell.colSpan && cell.colSpan > 1) {
                      const alignChar = cell.align === 'center' ? 'C' : cell.align === 'right' ? 'R' : 'L';
                      return `\\multicolumn{${cell.colSpan}}{${alignChar}}{${escaped}}`;
                    }
                    return escaped;
                  })
                  .join(' & ')} \\\\`
            )
            .join('\n')}
\\hline
\\end{tabulary}}
\\end{${tabEnv}}\n`;
    }

    if (sec.pageBreakAfter) {
      bodyLatex += `\n\\clearpage\n`;
    }
  });

  if (!bodyLatex.trim()) {
    bodyLatex = `\n\\section*{\\textbf{NỘI DUNG BẢN THẢO}}\nChưa có nội dung bài báo. Vui lòng thêm các đề mục, đoạn văn bản, bảng số liệu hoặc hình ảnh minh họa tại thẻ Nội dung.\n`;
  }

  let bibLatex = '';
  if (references.length > 0) {
    const balanceCmd = isOneColumn ? '' : '\\beforepage{\\balance} \n\n';
    bibLatex = `\n${balanceCmd}{\\sffamily\\fontsize{7}{8}\\selectfont \n\n\\begin{thebibliography}{10}\n\n` +
      references
        .map((r) => `\\bibitem{ref${r.id}}\n${escapeLatex(r.raw)}`)
        .join('\n\n') +
      `\n\n\\end{thebibliography}\n}\n`;
  }

  return `${preamblePart1}${metaBlock}${OFFICIAL_PREAMBLE_PART2}${titleBlock}${bodyLatex}${bibLatex}\n\\end{document}\n`;
}

export const exportToLatex = generateFullJournalLatex;

export function generateBibTex(paper: CompletePaper): string {
  const { references } = paper;
  let bib = `% BibTeX database for ${paper.metadata.journalId || 'article'}\n\n`;

  references.forEach((ref) => {
    const authorStr = Array.isArray(ref.authors) ? ref.authors.join(' and ') : (ref.authors || 'Author');
    bib += `@article{ref${ref.id},
  title = {${escapeLatex(ref.title || ref.raw)}},
  author = {${escapeLatex(authorStr)}},
  year = {${ref.year || '2026'}},
  journal = {${escapeLatex(ref.journal || paper.metadata.journalName)}}
}\n\n`;
  });

  return bib;
}

export async function generateLatexPackageZip(paper: CompletePaper, customSettings?: LayoutSettings): Promise<Blob> {
  const zip = new JSZip();
  const folderName = paper.id || 'vnuhcm_latex_package';
  const folder = zip.folder(folderName) || zip;

  folder.file('document.tex', generateFullJournalLatex(paper, customSettings));
  folder.file('references.bib', generateBibTex(paper));

  const imgFolder = folder.folder('images');
  paper.sections.forEach((sec, idx) => {
    if (sec.type === 'figure' && sec.figure && sec.figure.src) {
      const num = sec.figure.num || (idx + 1);
      if (sec.figure.src.startsWith('data:image')) {
        const parts = sec.figure.src.split(',');
        if (parts[1]) {
          const isJpg = sec.figure.src.startsWith('data:image/jpeg') || sec.figure.src.startsWith('data:image/jpg');
          const ext = isJpg ? 'jpg' : 'png';
          imgFolder?.file(`fig${num}.${ext}`, parts[1], { base64: true });
          imgFolder?.file(`fig${num}.png`, parts[1], { base64: true });
        }
      }
    }
  });

  return await zip.generateAsync({ type: 'blob' });
}
