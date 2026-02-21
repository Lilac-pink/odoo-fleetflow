// src/routes/expenses.js
const express = require('express');
const router = express.Router();

const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');

const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getExpenses);

router.post('/', authorize('DISPATCHER', 'ADMIN'), createExpense);

router.put('/:id', authorize('DISPATCHER', 'ADMIN'), updateExpense);

router.delete('/:id', authorize('ADMIN'), deleteExpense);

module.exports = router;