import express from 'express';
import { apiLogin, apiMe } from '../controllers/apiAuthController.js';
import { verifyJwt, requireRole } from '../middlewares/jwtAuth.js';
import { postUser, userData } from '../controllers/usersController.js';
import {
  apiIndexDemandeFourniture,
  apiCreateDemandeFourniture,
  apiViewDemandeFourniture,
  apiEditDemandeFourniture,
  apiStoreDemandeFourniture,
  apiUpdateDemandeFourniture,
  apiDeleteDemandeFourniture,
  apiUpdateValidationFourniture,
  apiValidateAllFourniture,
  apiUpdateDemandeStatus,
  apiUpdateDemandeFourniturePatch,
  apiUpdateDemandeFournitureMobile,
  apiAddPricingForDemande,
  apiUploadImageFourniture,
  apiUploadTempImage,
  apiDownloadImageFourniture,
  apiGenerateDemandeFourniturePDF,
  apiGetDesignationSuggestions,
  apiGetReferenceSuggestions,
  apiGetItemByReference,
} from '../controllers/apiFournitureController.js';
import { uploadFour } from '../controllers/demandeFourniture.js';

export const apiRouter = express.Router();

// Auth
apiRouter.post('/auth/login', apiLogin);
apiRouter.get('/auth/me', verifyJwt, apiMe);

// Users (example endpoints for React Native)
apiRouter.get('/userData', verifyJwt, requireRole(['user']), userData);
apiRouter.post('/userData/post', verifyJwt, requireRole(['user']), postUser);

// Fourniture API Routes (for React Native)
// List and form data
apiRouter.get('/fournitures', verifyJwt, requireRole(['user']), apiIndexDemandeFourniture);
apiRouter.get('/fournitures/create', verifyJwt, requireRole(['user']), apiCreateDemandeFourniture);

// Suggestions for designation and reference (like web version)
apiRouter.get('/fournitures/suggestions/designations', verifyJwt, requireRole(['user']), apiGetDesignationSuggestions);
apiRouter.get('/fournitures/suggestions/references', verifyJwt, requireRole(['user']), apiGetReferenceSuggestions);
apiRouter.get('/fournitures/suggestions/item-by-reference', verifyJwt, requireRole(['user']), apiGetItemByReference);

// Single demande operations
apiRouter.get('/fournitures/:id', verifyJwt, requireRole(['user']), apiViewDemandeFourniture);
apiRouter.get('/fournitures/:id/edit', verifyJwt, requireRole(['user']), apiEditDemandeFourniture);
apiRouter.post('/fournitures', verifyJwt, requireRole(['user']), uploadFour.any(), apiStoreDemandeFourniture);
apiRouter.put('/fournitures/:id', verifyJwt, requireRole(['user']), uploadFour.any(), apiUpdateDemandeFourniture);
apiRouter.patch('/fournitures/:id', verifyJwt, requireRole(['user']), uploadFour.any(), apiUpdateDemandeFourniturePatch);
apiRouter.delete('/fournitures/:id', verifyJwt, requireRole(['user']), apiDeleteDemandeFourniture);

apiRouter.put('/fournitures/:id/mobile', verifyJwt, requireRole(['user']), uploadFour.any(), apiUpdateDemandeFournitureMobile);

// Validation & status
apiRouter.patch('/fournitures/:id/validate', verifyJwt, requireRole(['admin', 'grandadmin']), apiUpdateValidationFourniture);
apiRouter.patch('/fournitures/:id/validate-all', verifyJwt, requireRole(['admin', 'grandadmin']), apiValidateAllFourniture);
apiRouter.patch('/fournitures/:id/status', verifyJwt, requireRole(['admin', 'grandadmin']), apiUpdateDemandeStatus);

// Pricing
apiRouter.put('/fournitures/:id/pricing', verifyJwt, requireRole(['admin', 'grandadmin']), apiAddPricingForDemande);

// Image upload/download
apiRouter.post('/fournitures/:id/upload-image', verifyJwt, requireRole(['user']), uploadFour.single('image'), apiUploadImageFourniture);
apiRouter.post('/fournitures/upload-temp-image', verifyJwt, requireRole(['user']), uploadFour.single('image'), apiUploadTempImage);
apiRouter.get('/fournitures/:id/download-image', verifyJwt, requireRole(['user']), apiDownloadImageFourniture);

// PDF generation
apiRouter.get('/fournitures/:id/pdf', verifyJwt, requireRole(['user']), apiGenerateDemandeFourniturePDF);
