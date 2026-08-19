import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getEmployees, createEmployee, deleteEmployee } from '../controllers/employees.controller';

const router = express.Router();

router.get('/', authenticate, getEmployees);
router.post('/', authenticate, createEmployee);
router.delete('/:id', authenticate, deleteEmployee);

export default router;
