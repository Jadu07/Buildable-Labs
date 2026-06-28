import { Response, NextFunction } from 'express';
import { DocumentService } from '../services/DocumentService';
import { AuthRequest } from '../middlewares/authMiddleware';

export class DocumentController {
  private documentService: DocumentService;

  constructor() {
    this.documentService = new DocumentService();
  }

  createDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const document = await this.documentService.createDocument(req.user!.id, req.body);
      res.status(201).json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  };

  getUserDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const documents = await this.documentService.getUserDocuments(req.user!.id);
      res.status(200).json({ success: true, data: documents });
    } catch (error) {
      next(error);
    }
  };

  getDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const document = await this.documentService.getDocument(req.user!.id, req.params.id as string);
      res.status(200).json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  };

  updateDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const document = await this.documentService.updateDocument(req.user!.id, req.params.id as string, req.body);
      res.status(200).json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  };

  deleteDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.documentService.deleteDocument(req.user!.id, req.params.id as string);
      res.status(200).json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  shareDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const collaborator = await this.documentService.shareDocument(req.user!.id, req.params.id as string, req.body);
      res.status(200).json({ success: true, data: collaborator });
    } catch (error) {
      next(error);
    }
  };

  updateCollaborator = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId, role } = req.body;
      const collaborator = await this.documentService.updateCollaborator(req.user!.id, req.params.id as string, userId, role);
      res.status(200).json({ success: true, data: collaborator });
    } catch (error) {
      next(error);
    }
  };

  removeCollaborator = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.documentService.removeCollaborator(req.user!.id, req.params.id as string, req.params.userId as string);
      res.status(200).json({ success: true, message: 'Collaborator removed' });
    } catch (error) {
      next(error);
    }
  };

  uploadAttachment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file provided' });
      }

      const result = await this.documentService.uploadAttachment(req.user!.id, req.params.id as string, req.file);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const history = await this.documentService.getHistory(req.user!.id, req.params.id as string);
      res.status(200).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  };

  saveHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { content, version } = req.body;
      const history = await this.documentService.saveHistory(req.user!.id, req.params.id as string, content, version);
      res.status(201).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  };
}
