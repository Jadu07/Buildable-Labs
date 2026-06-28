import { DocumentRepository } from '../repositories/DocumentRepository';
import { UserRepository } from '../repositories/UserRepository';
import { CreateDocumentInput, UpdateDocumentInput, ShareDocumentInput } from '../validators/documentValidators';
import { Role } from '@prisma/client';

export class DocumentService {
  private documentRepository: DocumentRepository;
  private userRepository: UserRepository;

  constructor() {
    this.documentRepository = new DocumentRepository();
    this.userRepository = new UserRepository();
  }

  async createDocument(userId: string, data: CreateDocumentInput) {
    return this.documentRepository.create(userId, data.title);
  }

  async getUserDocuments(userId: string) {
    return this.documentRepository.findUserDocuments(userId);
  }

  async getDocument(userId: string, documentId: string) {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw { statusCode: 404, message: 'Document not found' };
    }

    const hasAccess = document.collaborators.some((collab: any) => collab.userId === userId);
    if (!hasAccess && !document.isPublic) {
      throw { statusCode: 403, message: 'Access denied' };
    }

    return document;
  }

  async updateDocument(userId: string, documentId: string, data: UpdateDocumentInput) {
    const document = await this.getDocument(userId, documentId);
    
    // Check if user has edit rights
    if (!document.isPublic) {
      const collaborator = document.collaborators.find((c: any) => c.userId === userId);
      if (!collaborator || ['VIEWER', 'COMMENTER'].includes(collaborator.role)) {
        throw { statusCode: 403, message: 'You do not have permission to edit this document' };
      }
    }

    return this.documentRepository.update(documentId, data);
  }

  async deleteDocument(userId: string, documentId: string) {
    const document = await this.getDocument(userId, documentId);

    if (document.ownerId !== userId) {
      throw { statusCode: 403, message: 'Only the owner can delete this document' };
    }

    await this.documentRepository.delete(documentId);
  }

  async shareDocument(userId: string, documentId: string, data: ShareDocumentInput) {
    const document = await this.getDocument(userId, documentId);
    
    // Only owner or editors can share
    const collaborator = document.collaborators.find((c: any) => c.userId === userId);
    if (!collaborator || !['OWNER', 'EDITOR'].includes(collaborator.role)) {
      throw { statusCode: 403, message: 'You do not have permission to share this document' };
    }

    const targetUser = await this.userRepository.findByEmail(data.email);
    if (!targetUser) {
      throw { statusCode: 404, message: 'User not found with this email' };
    }

    return this.documentRepository.addCollaborator(documentId, targetUser.id, data.role as Role);
  }

  async updateCollaborator(userId: string, documentId: string, targetUserId: string, role: string) {
    const document = await this.getDocument(userId, documentId);
    
    const collaborator = document.collaborators.find((c: any) => c.userId === userId);
    if (!collaborator || !['OWNER', 'EDITOR'].includes(collaborator.role)) {
      throw { statusCode: 403, message: 'You do not have permission to change roles' };
    }

    const targetCollab = document.collaborators.find((c: any) => c.userId === targetUserId);
    if (targetCollab && targetCollab.role === 'OWNER' && collaborator.role !== 'OWNER') {
      throw { statusCode: 403, message: 'You cannot change the owner\'s role' };
    }

    return this.documentRepository.addCollaborator(documentId, targetUserId, role as Role);
  }

  async removeCollaborator(userId: string, documentId: string, targetUserId: string) {
    const document = await this.getDocument(userId, documentId);
    
    const collaborator = document.collaborators.find((c: any) => c.userId === userId);
    if (!collaborator || (!['OWNER', 'EDITOR'].includes(collaborator.role) && userId !== targetUserId)) {
      throw { statusCode: 403, message: 'You do not have permission to remove this user' };
    }

    const targetCollab = document.collaborators.find((c: any) => c.userId === targetUserId);
    if (targetCollab && targetCollab.role === 'OWNER') {
      throw { statusCode: 403, message: 'You cannot remove the owner' };
    }

    await this.documentRepository.removeCollaborator(documentId, targetUserId);
  }

  async uploadAttachment(userId: string, documentId: string, file: Express.Multer.File) {
    // Verify permissions first
    const document = await this.getDocument(userId, documentId);
    const collaborator = document.collaborators.find((c: any) => c.userId === userId);
    if (!collaborator || ['VIEWER', 'COMMENTER'].includes(collaborator.role)) {
      throw { statusCode: 403, message: 'You do not have permission to upload files to this document' };
    }

    const { supabase } = await import('../storage/supabase');

    const fileExt = file.originalname.split('.').pop();
    const fileName = `${documentId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('documents') // ensure you have a "documents" bucket created in Supabase
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw { statusCode: 500, message: `Storage error: ${error.message}` };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path);

    return { url: publicUrl, path: data.path };
  }

  async getHistory(userId: string, documentId: string) {
    await this.getDocument(userId, documentId); // ensure access
    return this.documentRepository.getHistory(documentId);
  }

  async saveHistory(userId: string, documentId: string, content: any, version: number) {
    const document = await this.getDocument(userId, documentId);
    
    // Check if user has edit rights
    if (!document.isPublic) {
      const collaborator = document.collaborators.find((c: any) => c.userId === userId);
      if (!collaborator || ['VIEWER', 'COMMENTER'].includes(collaborator.role)) {
        throw { statusCode: 403, message: 'You do not have permission to save history for this document' };
      }
    }

    return this.documentRepository.saveHistory(documentId, content, version);
  }
}
