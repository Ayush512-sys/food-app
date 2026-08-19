import { Router } from 'express';
import { getCustomers, createCustomer, getSuppliers, createSupplier, createPurchaseBill, createInvoice, getInvoices } from '../controllers/billing.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/customers', getCustomers);
router.post('/customers', createCustomer);

router.get('/suppliers', getSuppliers);
router.post('/suppliers', createSupplier);

router.post('/purchases', createPurchaseBill);

router.get('/invoices', getInvoices);
router.post('/invoices', createInvoice);

export default router;
