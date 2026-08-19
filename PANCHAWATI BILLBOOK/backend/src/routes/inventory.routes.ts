import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory, getLocations, createLocation, getProducts, createProduct, updateProduct, deleteProduct, getInventory, adjustStock, getProductHistory, scanProduct } from '../controllers/inventory.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/categories', getCategories);
router.post('/categories', requireAdmin, createCategory);
router.put('/categories/:id', requireAdmin, updateCategory);
router.delete('/categories/:id', requireAdmin, deleteCategory);

router.get('/locations', getLocations);
router.post('/locations', requireAdmin, createLocation);

router.get('/products', getProducts);
router.post('/products', requireAdmin, createProduct);
router.put('/products/:id', requireAdmin, updateProduct);
router.delete('/products/:id', requireAdmin, deleteProduct);
router.get('/products/:id/history', getProductHistory);

router.get('/stock', getInventory);
router.post('/stock/adjust', requireAdmin, adjustStock);
router.get('/stock/scan/:barcode', scanProduct);

export default router;
