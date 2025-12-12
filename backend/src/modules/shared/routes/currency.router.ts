import { Router } from 'express';
import { CurrencyController } from '../controllers/currency.controller';

const router = Router();

router.get('/', CurrencyController.list);
router.post('/', CurrencyController.create);
router.put('/:id', CurrencyController.update);
router.delete('/:id', CurrencyController.remove);
router.put('/:code/rate', CurrencyController.updateRate);
router.post('/update-rates', CurrencyController.updateRates);
router.post('/:code/update-rate', CurrencyController.updateSingleRate);

export default router;

