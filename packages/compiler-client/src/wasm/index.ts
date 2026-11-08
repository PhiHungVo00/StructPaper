export {
  WasmCompiler,
  type WasmCompilerOptions,
} from './wasm-compiler';

export {
  parseLatexLog,
} from './log-parser';

export {
  VirtualFS,
  type StageOptions,
} from './virtual-fs';

export {
  WorkerBridge,
  type WorkerBridgeOptions,
  type CompileWorkerPayload,
  type CompileWorkerResult,
} from './worker-bridge';

export {
  typesetLatexToPdf,
  PDFTypesetter,
  type TypesetterOptions,
} from './typesetter/pdf-typesetter';

export {
  parseLatexToAST,
  cleanLatexText,
} from './parser/latex-ast-parser';

export type {
  PaperAST,
  ASTBlock,
  ASTMetadata,
  ASTTable,
  ASTReference,
} from './parser/ast-types';
