import { getCurrentUser } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import * as dashboardService from './dashboard.service.js';

/** GET /api/v1/dashboard/vendor */

export const getVendorOverview = asyncHandler(async (req, res) => {
  const vendor = getCurrentUser(req);
  const overview = await dashboardService.getVendorOverview(vendor);

  return sendResponse(res, { message: 'Vendor dashboard overview fetched successfully', data: overview });
});

/** GET /api/v1/dashboard/customer */

export const getCustomerOverview = asyncHandler(async (req, res) => {
  const customer = getCurrentUser(req);
  const overview = await dashboardService.getCustomerOverview(customer.id);

  return sendResponse(res, {
    message: 'Customer dashboard overview fetched successfully',
    data: overview,
  });
});

/** GET /api/v1/dashboard/admin */

export const getAdminOverview = asyncHandler(async (req, res) => {
  getCurrentUser(req);
  const overview = await dashboardService.getAdminOverview();

  return sendResponse(res, { message: 'Admin dashboard overview fetched successfully', data: overview });
});
