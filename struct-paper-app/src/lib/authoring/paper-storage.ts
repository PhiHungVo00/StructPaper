import { CompletePaper, createEmptyPaper } from '@/types/paper';
import { UniversalTemplateSchema } from '@/types/template-builder';
import { SAMPLE_PAPER_HS630 } from '@/lib/sample-papers';

const STORAGE_KEY = 'structpaper_authoring_papers_v1';

/**
 * Default mock papers for the authoring hub
 */
export const DEFAULT_MOCK_PAPERS: CompletePaper[] = [
  {
    ...SAMPLE_PAPER_HS630,
    id: 'paper_vnuhcm_hs630',
    templateId: 'vnuhcm_health_sciences_id630',
    templateName: 'Tạp chí Khoa học Sức khỏe ĐHQG-HCM (ID630)',
    status: 'ready',
    createdAt: '2026-10-14T08:30:00.000Z',
    updatedAt: '2026-10-21T14:45:00.000Z',
  },
  {
    id: 'paper_ieee_dl_segmentation',
    metadata: {
      title: 'Deep Learning Multi-Phase CT Liver Tumor Segmentation with Residual Attention U-Net',
      titleEn: 'Deep Learning Multi-Phase CT Liver Tumor Segmentation with Residual Attention U-Net',
      articleType: 'Research Article',
      journalId: 'IEEE-TMI',
      journalName: 'IEEE Transactions on Medical Imaging',
      journalAbbv: 'IEEE Trans. Med. Imaging',
      authors: [
        {
          id: 'auth_1',
          name: 'Nguyen Minh Tri',
          email: 'tri.nm@structpaper.edu.vn',
          affiliationIds: [1],
          isCorresponding: true,
          orcid: '0000-0002-1825-0097',
        },
        {
          id: 'auth_2',
          name: 'Tran Hoang Nam',
          email: 'nam.th@structpaper.edu.vn',
          affiliationIds: [1, 2],
          isCorresponding: false,
        },
        {
          id: 'auth_3',
          name: 'Sarah Jenkins',
          email: 's.jenkins@oxford.ac.uk',
          affiliationIds: [2],
          isCorresponding: false,
        },
      ],
      affiliations: [
        {
          id: 1,
          name: 'Department of Biomedical Engineering, VNU-HCM University of Technology, Ho Chi Minh City, Vietnam',
        },
        {
          id: 2,
          name: 'Institute of Biomedical Engineering, University of Oxford, Oxford, United Kingdom',
        },
      ],
      corresponding: {
        name: 'Nguyen Minh Tri',
        email: 'tri.nm@structpaper.edu.vn',
        affiliation: 'Department of Biomedical Engineering, VNU-HCM University of Technology',
      },
      abstract:
        'Accurate segmentation of liver tumors in multi-phase computed tomography (CT) scans is essential for clinical diagnosis and surgical resection planning. In this study, we propose a 3D Residual Attention U-Net architecture integrated with cross-phase feature fusion to capture both spatial anatomical details and temporal contrast dynamics. Experiments conducted on the LiTS and private multi-phase datasets demonstrate a Dice Similarity Coefficient of 84.6% for focal lesions, surpassing state-of-the-art benchmarks by 3.2% while achieving inference speeds suitable for real-time surgical navigation.',
      keywords: [
        'Liver tumor segmentation',
        'Deep learning',
        'Multi-phase CT',
        'Attention U-Net',
        'Medical image analysis',
      ],
      dates: {
        received: '20-08-2026',
        revised: '15-09-2026',
        accepted: '10-10-2026',
        published: '20-10-2026',
      },
      doi: '10.1109/TMI.2026.3190821',
      volume: '45',
      issue: '10',
      year: '2026',
      firstPage: 2840,
      lastPage: 2854,
    },
    sections: [
      {
        id: 'sec_intro',
        type: 'h1',
        title: 'I. INTRODUCTION',
        content: '',
      },
      {
        id: 'sec_intro_p1',
        type: 'paragraph',
        content:
          'Hepatocellular carcinoma (HCC) is one of the leading causes of cancer-related mortality globally. Computed tomography (CT) with tri-phasic intravenous contrast—including non-contrast, arterial, and portal venous phases—remains the gold standard for non-invasive diagnosis.',
      },
      {
        id: 'sec_methods',
        type: 'h1',
        title: 'II. METHODOLOGY & NETWORK ARCHITECTURE',
        content: '',
      },
      {
        id: 'sec_methods_p1',
        type: 'paragraph',
        content:
          'Our network pipeline accepts 4D volumetric tensor inputs comprising co-registered arterial and portal venous volumes. A bottleneck feature aggregation layer computes multi-scale cross-attention weights before feeding into the decoding synthesis stages.',
      },
      {
        id: 'sec_fig1',
        type: 'figure',
        content: 'System architecture diagram.',
        figure: {
          id: 'fig_arch',
          num: 1,
          caption: 'Overview of the proposed 3D Residual Attention U-Net framework for multi-phase CT liver tumor segmentation.',
          src: '/sample-media/nature_cover_demo.jpg',
          isFullWidth: true,
        },
      },
      {
        id: 'sec_results',
        type: 'h1',
        title: 'III. EXPERIMENTAL RESULTS',
        content: '',
      },
      {
        id: 'sec_results_tab',
        type: 'table',
        content: 'Benchmark quantitative comparison.',
        table: {
          id: 'tab_metrics',
          num: 1,
          caption: 'Quantitative Segmentation Performance Comparison on LiTS Benchmark.',
          headers: ['Model Architecture', 'Dice Score (%)', 'VOE (%)', 'RVD (%)', 'Inference (ms)'],
          rows: [
            ['Standard 3D U-Net', '78.4 ± 3.1', '34.2 ± 4.5', '12.8 ± 3.0', '180'],
            ['nnU-Net Baseline', '81.4 ± 2.6', '29.7 ± 3.8', '8.4 ± 2.1', '245'],
            ['Proposed Res-Attn 3D', '84.6 ± 2.1', '25.3 ± 3.2', '5.1 ± 1.8', '195'],
          ],
        },
      },
    ],
    references: [
      {
        id: 1,
        raw: 'O. Ronneberger, P. Fischer, and T. Brox, "U-Net: Convolutional networks for biomedical image segmentation," in MICCAI, 2015, pp. 234-241.',
        authors: 'O. Ronneberger et al.',
        title: 'U-Net: Convolutional networks for biomedical image segmentation',
        year: '2015',
        isCited: true,
        citationCount: 14,
      },
      {
        id: 2,
        raw: 'F. Isensee et al., "nnU-Net: a self-configuring method for deep learning-based biomedical image segmentation," Nature Methods, vol. 18, no. 2, pp. 203-211, 2021.',
        authors: 'F. Isensee et al.',
        title: 'nnU-Net: a self-configuring method for deep learning-based biomedical image segmentation',
        year: '2021',
        isCited: true,
        citationCount: 8,
      },
    ],
    templateId: 'ieee_transactions_standard',
    templateName: 'IEEE Transactions (2 Cột Tiêu Chuẩn Quốc Tế)',
    status: 'draft',
    createdAt: '2026-10-18T10:00:00.000Z',
    updatedAt: '2026-10-20T16:20:00.000Z',
  },
  {
    id: 'paper_nature_photodynamics',
    metadata: {
      title: 'Nanoparticle-Enhanced Photodynamic Therapy for Targeted Eradication of Hypoxic Pancreatic Adenocarcinoma',
      titleEn: 'Nanoparticle-Enhanced Photodynamic Therapy for Targeted Eradication of Hypoxic Pancreatic Adenocarcinoma',
      articleType: 'Article',
      journalId: 'Nature-Bio',
      journalName: 'Nature Biomedical Engineering',
      journalAbbv: 'Nat. Biomed. Eng.',
      authors: [
        {
          id: 'auth_nat_1',
          name: 'Prof. Le Thi Mai',
          email: 'mai.le@med.vnu.edu.vn',
          affiliationIds: [1],
          isCorresponding: true,
        },
        {
          id: 'auth_nat_2',
          name: 'David K. Anderson',
          email: 'd.anderson@harvard.edu',
          affiliationIds: [2],
          isCorresponding: false,
        },
      ],
      affiliations: [
        {
          id: 1,
          name: 'School of Medicine & Pharmacy, Vietnam National University, Hanoi, Vietnam',
        },
        {
          id: 2,
          name: 'Department of Chemical Biology, Harvard University, Cambridge, MA, USA',
        },
      ],
      corresponding: {
        name: 'Prof. Le Thi Mai',
        email: 'mai.le@med.vnu.edu.vn',
        affiliation: 'School of Medicine & Pharmacy, Vietnam National University',
      },
      abstract:
        'Pancreatic ductal adenocarcinoma is characterized by a dense desmoplastic stroma and profound tissue hypoxia that severely compromise conventional chemoradiotherapy. Here we demonstrate a biomimetic oxygen-generating nanocarrier that selectively extravasates into tumor microvasculature, catalytic generates molecular oxygen in situ, and sensitizes deep tumor margins to near-infrared photodynamic ablation.',
      keywords: [
        'Pancreatic adenocarcinoma',
        'Photodynamic therapy',
        'Tumor hypoxia',
        'Nanomedicine',
        'Oxygen self-supply',
      ],
      dates: {
        received: '12-05-2026',
        revised: '18-08-2026',
        accepted: '05-10-2026',
        published: '18-10-2026',
      },
      doi: '10.1038/s41551-026-00912-x',
      volume: '10',
      issue: '4',
      year: '2026',
      firstPage: 412,
      lastPage: 428,
    },
    sections: [
      {
        id: 'sec_nat_1',
        type: 'paragraph',
        content:
          'Despite intensive therapeutic advances over the past two decades, pancreatic ductal adenocarcinoma continues to exhibit a dismal five-year survival rate of less than 10%. Hypoxia-induced drug resistance remains a principal impediment.',
      },
      {
        id: 'sec_nat_results',
        type: 'h1',
        title: 'Nanocarrier synthesis and catalytic oxygen generation',
        content: '',
      },
      {
        id: 'sec_nat_p2',
        type: 'paragraph',
        content:
          'We synthesized porous metal-organic framework cores encapsulating catalase and chlorin e6, coated with platelet-leukocyte hybrid membranes for immune camouflage.',
      },
    ],
    references: [],
    templateId: 'nature_springer_modern',
    templateName: 'Nature / Springer Tạp Chí Khoa Học Quốc Tế',
    status: 'review',
    createdAt: '2026-10-10T09:15:00.000Z',
    updatedAt: '2026-10-18T11:40:00.000Z',
  },
];

/**
 * Retrieve all authoring papers from local storage (or fallback to initial mock papers)
 */
export function getAuthoringPapers(): CompletePaper[] {
  if (typeof window === 'undefined') return DEFAULT_MOCK_PAPERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_PAPERS));
      return DEFAULT_MOCK_PAPERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_PAPERS));
    return DEFAULT_MOCK_PAPERS;
  } catch (err) {
    console.error('Failed to load authoring papers from storage:', err);
    return DEFAULT_MOCK_PAPERS;
  }
}

/**
 * Get a single paper by ID
 */
export function getAuthoringPaperById(id: string): CompletePaper | null {
  const papers = getAuthoringPapers();
  return papers.find((p) => p.id === id) || null;
}

/**
 * Save / Update a paper in local storage
 */
export function saveAuthoringPaper(paper: CompletePaper): void {
  if (typeof window === 'undefined') return;
  try {
    const papers = getAuthoringPapers();
    const updatedPaper: CompletePaper = {
      ...paper,
      updatedAt: new Date().toISOString(),
    };
    const existingIndex = papers.findIndex((p) => p.id === paper.id);
    let nextPapers: CompletePaper[];
    if (existingIndex >= 0) {
      nextPapers = [...papers];
      nextPapers[existingIndex] = updatedPaper;
    } else {
      nextPapers = [updatedPaper, ...papers];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPapers));
  } catch (err) {
    console.error('Failed to save authoring paper:', err);
  }
}

/**
 * Duplicate a paper
 */
export function duplicateAuthoringPaper(id: string): CompletePaper | null {
  const target = getAuthoringPaperById(id);
  if (!target) return null;
  const newPaper: CompletePaper = {
    ...JSON.parse(JSON.stringify(target)),
    id: `paper_${Date.now()}`,
    metadata: {
      ...target.metadata,
      title: `${target.metadata.title} (Bản sao)`,
    },
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveAuthoringPaper(newPaper);
  return newPaper;
}

/**
 * Delete a paper by ID
 */
export function deleteAuthoringPaper(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const papers = getAuthoringPapers();
    const nextPapers = papers.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPapers));
  } catch (err) {
    console.error('Failed to delete authoring paper:', err);
  }
}

/**
 * Create a new authoring paper initialized from a template schema
 */
export function createNewPaperFromTemplate(
  template: UniversalTemplateSchema,
  customTitle?: string
): CompletePaper {
  const isVnuhcm = template.id.includes('vnuhcm');
  const now = new Date();
  const year = now.getFullYear().toString();

  const emptyBase = createEmptyPaper(template.id);

  const newPaper: CompletePaper = {
    ...emptyBase,
    id: `paper_${Date.now()}`,
    templateId: template.id,
    templateName: template.name,
    status: 'draft',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    metadata: {
      ...emptyBase.metadata,
      title: customTitle || (isVnuhcm ? 'Bản thảo bài báo khoa học mới' : 'Untitled Academic Paper'),
      articleType: isVnuhcm ? 'Bài báo nghiên cứu' : 'Research Article',
      journalId: template.id,
      journalName: template.institution || template.name,
      journalAbbv: template.institution || 'StructPaper Journal',
      authors: [
        {
          id: `auth_${Date.now()}_1`,
          name: template.author || 'Tác giả chính',
          email: 'author@university.edu.vn',
          affiliationIds: [1],
          isCorresponding: true,
        },
      ],
      affiliations: [
        {
          id: 1,
          name: template.institution || 'Đại học Quốc gia Thành phố Hồ Chí Minh',
        },
      ],
      corresponding: {
        name: template.author || 'Tác giả chính',
        email: 'author@university.edu.vn',
        affiliation: template.institution || 'Đại học Quốc gia Thành phố Hồ Chí Minh',
      },
      abstract:
        'Nhập tóm tắt nội dung nghiên cứu khoa học tại đây. Nêu rõ bối cảnh, phương pháp thực nghiệm, kết quả thu được và đóng góp chính của bài báo.',
      keywords: ['Bài báo khoa học', 'Phương pháp nghiên cứu', 'ĐHQG-HCM'],
      dates: {
        received: `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${year}`,
        revised: '',
        accepted: '',
        published: '',
      },
      doi: `https://doi.org/10.32508/${template.id}.${year}.001`,
      volume: '1',
      issue: '1',
      year,
      firstPage: 1,
      lastPage: 10,
    },
    sections: [
      {
        id: `sec_${Date.now()}_1`,
        type: 'h1',
        title: isVnuhcm ? '1. GIỚI THIỆU' : '1. INTRODUCTION',
        content: '',
      },
      {
        id: `sec_${Date.now()}_2`,
        type: 'paragraph',
        content:
          'Đặt vấn đề và tổng quan các nghiên cứu liên quan. Giới thiệu mục tiêu nghiên cứu và cấu trúc bài báo.',
      },
      {
        id: `sec_${Date.now()}_3`,
        type: 'h1',
        title: isVnuhcm ? '2. PHƯƠNG PHÁP NGHIÊN CỨU' : '2. METHODOLOGY',
        content: '',
      },
      {
        id: `sec_${Date.now()}_4`,
        type: 'paragraph',
        content:
          'Mô tả chi tiết phương pháp tiếp cận, mô hình toán học hoặc thiết kế thí nghiệm.',
      },
      {
        id: `sec_${Date.now()}_5`,
        type: 'h1',
        title: isVnuhcm ? '3. KẾT QUẢ VÀ THẢO LUẬN' : '3. RESULTS AND DISCUSSION',
        content: '',
      },
      {
        id: `sec_${Date.now()}_6`,
        type: 'paragraph',
        content:
          'Trình bày kết quả nghiên cứu định lượng, phân tích so sánh với các công trình trước đây.',
      },
      {
        id: `sec_${Date.now()}_7`,
        type: 'h1',
        title: isVnuhcm ? '4. KẾT LUẬN' : '4. CONCLUSION',
        content: '',
      },
      {
        id: `sec_${Date.now()}_8`,
        type: 'paragraph',
        content:
          'Tóm tắt các đóng góp khoa học chính và đề xuất hướng phát triển tiếp theo.',
      },
    ],
    references: [
      {
        id: 1,
        raw: 'Nguyen, V. A., & Tran, H. (2025). Advanced Structural Extraction and Typesetting for Scientific Papers. Journal of Science & Technology, 12(3), 45-58.',
        authors: 'Nguyen, V. A., Tran, H.',
        title: 'Advanced Structural Extraction and Typesetting for Scientific Papers',
        year: '2025',
        isCited: true,
        citationCount: 1,
      },
    ],
  };

  saveAuthoringPaper(newPaper);
  return newPaper;
}
