import { z } from 'zod';

export const createDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').optional(),
  }),
});

export const updateDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    content: z.any().optional(), // Can be more strictly typed based on TipTap JSON format later
    isPublic: z.boolean().optional(),
    publicRole: z.enum(['EDITOR', 'COMMENTER', 'VIEWER']).optional(),
  }),
});

export const shareDocumentSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['EDITOR', 'COMMENTER', 'VIEWER', 'CONTRIBUTOR']),
  }),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>['body'];
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>['body'];
export type ShareDocumentInput = z.infer<typeof shareDocumentSchema>['body'];
