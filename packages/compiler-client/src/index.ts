// Core Interfaces
export type {
  CompilerPort,
  CompileRequest,
  CompileResult,
  CompileReport,
  CompileReportIssue,
  CapabilityVerdict,
  CompileProgress,
  Unsubscribe,
} from './interfaces/compiler-port';

// Router Types & Contracts
export type {
  CompilerKind,
  CompileContext,
  Decision,
  ReasonCode,
  Rule,
  RulePorts,
  Notice,
} from './interfaces/compiler-router.types';

// Compile Scheduler & Lifecycle
export {
  CompileScheduler,
  CompileAbortError,
  type CompileStatus,
  type CompileStatusContext,
  type CompileStatusListener,
  type CompileSchedulerOptions,
} from './scheduler/compile-scheduler';

// Adapters
export {
  LocalNextCompilerAdapter,
  type LocalNextCompilerOptions,
} from './adapters/local-next-compiler';

export {
  MockCompilerAdapter,
  type MockCompilerOptions,
} from './adapters/mock-compiler';

export {
  TauriDesktopCompiler,
  isTauriEnvironment,
} from './adapters/tauri-desktop-compiler';

// Utilities
export {
  computeSha256,
  hashCompileRequest,
} from './utils/hash-utils';

// Compiler Router & 11 Decision Rules (Table 9.2)
export * from './router';

// Network & Reachability Monitor
export * from './monitor';

// WebAssembly Compiler & Virtual Filesystem
export * from './wasm';

// Remote Compiler Adapter
export * from './remote';

// Compilation Result Cache
export * from './cache';

