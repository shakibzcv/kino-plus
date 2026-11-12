import { Router } from 'express';
import { countryController } from '../controllers/country.controller';

const router = Router();

router.get('/', countryController.detectCountry);

export default router;
export { router as countryRouter };
