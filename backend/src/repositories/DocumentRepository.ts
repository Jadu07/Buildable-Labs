import { prisma } from '../prisma/client';
import { Document, Role, Collaborator, DocumentHistory } from '@prisma/client';

export class DocumentRepository {
  async create(ownerId: string, title?: string): Promise<Document> {
    return prisma.document.create({
      data: {
        ownerId,
        title: title || 'Untitled Document',
        content: { type: 'doc', content: [] }, // Default empty TipTap document
        collaborators: {
          create: {
            userId: ownerId,
            role: Role.OWNER,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.document.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        collaborators: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  async findUserDocuments(userId: string): Promise<Document[]> {
    return prisma.document.findMany({
      where: {
        collaborators: {
          some: {
            userId,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, data: { title?: string; content?: any; isPublic?: boolean; publicRole?: Role }): Promise<Document> {
    return prisma.document.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.$transaction([
      prisma.collaborator.deleteMany({ where: { documentId: id } }),
      prisma.documentHistory.deleteMany({ where: { documentId: id } }),
      prisma.document.delete({ where: { id } }),
    ]);
  }

  async addCollaborator(documentId: string, userId: string, role: Role): Promise<Collaborator> {
    const existing = await prisma.collaborator.findFirst({
      where: { documentId, userId }
    });
    
    if (existing) {
      return prisma.collaborator.update({
        where: { id: existing.id },
        data: { role },
      });
    }

    return prisma.collaborator.create({
      data: {
        documentId,
        userId,
        role,
      },
    });
  }

  async removeCollaborator(documentId: string, userId: string): Promise<void> {
    await prisma.collaborator.deleteMany({
      where: { documentId, userId },
    });
  }

  async getHistory(documentId: string): Promise<DocumentHistory[]> {
    return prisma.documentHistory.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveHistory(documentId: string, content: any, version: number): Promise<DocumentHistory> {
    return prisma.documentHistory.create({
      data: {
        documentId,
        content,
        version,
      },
    });
  }
}
