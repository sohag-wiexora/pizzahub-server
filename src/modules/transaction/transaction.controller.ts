import { getCurrentUser } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { parsePagination } from '../../utils/pagination.js';
import { asOptionalString } from '../../utils/query.js';
import { sendResponse } from '../../utils/sendResponse.js';
import * as transactionService from './transaction.service.js';

/** GET /api/v1/transactions?status=&plan=&page=&limit= */

export const listTransactions = asyncHandler(async (req, res) => {
  getCurrentUser(req);

  const result = await transactionService.listTransactions({
    ...parsePagination(req.query),
    status: asOptionalString(req.query.status),
    plan: asOptionalString(req.query.plan),
  });

  return sendResponse(res, {
    message: 'Transactions fetched successfully',
    data: result.transactions,
    meta: result.meta,
  });
});
