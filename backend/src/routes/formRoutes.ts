import { Router } from 'express';
import { getConfiguration, submitForm } from '../controllers/formController';

const router = Router();

router.get('/form-configurations', getConfiguration);
router.post('/form-submissions', submitForm);

export default router;
