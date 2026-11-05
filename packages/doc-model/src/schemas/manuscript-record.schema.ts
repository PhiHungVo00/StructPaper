import { z } from 'zod';
import type {
  WorkflowStatus,
  ManuscriptSourceInfo,
  ManuscriptInfo,
  ManuscriptRecord,
} from '../types/manuscript-record';
import { ManuscriptSchema, ProfilePinSchema } from './manuscript.schema';

export { ProfilePinSchema };

export const WorkflowStatusSchema: z.ZodType<WorkflowStatus> = z.enum([
  'draft',
  'in-review',
  'proofing',
  'ready',
  'published',
]);

export const ManuscriptSourceInfoSchema: z.ZodType<ManuscriptSourceInfo> = z.object({
  fileName: z.string().min(1),
  importedAt: z.string().min(1),
  sha256: z.string().min(1),
});

export const ManuscriptInfoSchema: z.ZodType<ManuscriptInfo> = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  submissionId: z.string().optional(),
  note: z.string().optional(),
  tags: z.array(z.string()).default([]),
  workflowStatus: WorkflowStatusSchema,
  pinned: z.boolean().default(false),
  archived: z.boolean().default(false),
  color: z.string().optional(),
  source: ManuscriptSourceInfoSchema.optional(),
  ownerId: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  lastOpenedAt: z.string().optional(),
});

export const ManuscriptRecordSchema: z.ZodType<ManuscriptRecord> = z.object({
  info: ManuscriptInfoSchema,
  doc: ManuscriptSchema,
  revision: z.number().int().nonnegative().optional(),
});
