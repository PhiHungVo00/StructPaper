/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-doc-model-contamination',
      comment:
        'packages/doc-model must NOT import anything from react, react-dom, DOM, apps/*, or sibling packages.',
      severity: 'error',
      from: {
        path: '^packages/doc-model',
      },
      to: {
        path: '(react|react-dom|apps/|packages/(?!doc-model))',
      },
    },
    {
      name: 'strict-downward-dependencies',
      comment:
        'packages/ingest-docx, packages/exporters, packages/qc-engine, packages/editor-core must only depend on packages/doc-model.',
      severity: 'error',
      from: {
        path: '^packages/(ingest-docx|exporters|qc-engine|editor-core)',
      },
      to: {
        path: '^(apps/|packages/(?!doc-model|\\1))',
      },
    },
    {
      name: 'storage-downward-dependencies',
      comment:
        'packages/storage must only depend on packages/doc-model and packages/editor-core.',
      severity: 'error',
      from: {
        path: '^packages/storage',
      },
      to: {
        path: '^(apps/|packages/(?!doc-model|editor-core|storage))',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
};
