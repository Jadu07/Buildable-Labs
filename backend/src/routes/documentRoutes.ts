import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { authenticate } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import { upload } from '../middlewares/uploadMiddleware';
import { createDocumentSchema, updateDocumentSchema, shareDocumentSchema } from '../validators/documentValidators';

const router = Router();
const documentController = new DocumentController();

// All document routes require authentication
router.use(authenticate);

router.get('/', documentController.getUserDocuments);
router.post('/', validate(createDocumentSchema), documentController.createDocument);
router.get('/:id', documentController.getDocument);
router.put('/:id', validate(updateDocumentSchema), documentController.updateDocument);
router.delete('/:id', documentController.deleteDocument);
router.post('/:id/share', validate(shareDocumentSchema), documentController.shareDocument);
router.put('/:id/collaborators', documentController.updateCollaborator);
router.delete('/:id/collaborators/:userId', documentController.removeCollaborator);
router.post('/:id/attachments', upload.single('file'), documentController.uploadAttachment);
router.get('/:id/history', documentController.getHistory);
router.post('/:id/history', documentController.saveHistory);

export default router;
