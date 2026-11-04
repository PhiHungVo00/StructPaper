import * as Comlink from 'comlink';
import {
  IngestPipeline,
  type IngestPipelineResult,
  type IngestOptions,
} from '../pipeline/ingest-pipeline';

export interface IngestWorkerApi {
  ingest(
    buffer: ArrayBuffer | Uint8Array,
    options?: IngestOptions
  ): Promise<IngestPipelineResult>;
}

export const ingestWorkerApi: IngestWorkerApi = {
  async ingest(
    buffer: ArrayBuffer | Uint8Array,
    options?: IngestOptions
  ): Promise<IngestPipelineResult> {
    const pipeline = new IngestPipeline();
    return await pipeline.ingest(buffer, options);
  },
};

// Check if running in a Web Worker environment
if (typeof self !== 'undefined' && typeof (self as any).postMessage === 'function') {
  // Expose via Comlink
  try {
    Comlink.expose(ingestWorkerApi);
  } catch {
    // Comlink already initialized or environment doesn't support Comlink
  }

  // Also support standard postMessage message passing for environments not using Comlink
  self.addEventListener('message', async (event: MessageEvent) => {
    // If message is from Comlink internal protocol, let Comlink handle it
    if (event.data && typeof event.data === 'object' && event.data.type?.startsWith?.('comlink')) {
      return;
    }

    if (event.data && event.data.action === 'ingest') {
      const { id, buffer, options } = event.data;
      try {
        const result = await ingestWorkerApi.ingest(buffer, options);
        (self as any).postMessage({ id, success: true, result });
      } catch (err: any) {
        (self as any).postMessage({
          id,
          success: false,
          error: err?.message || String(err),
        });
      }
    }
  });
}
