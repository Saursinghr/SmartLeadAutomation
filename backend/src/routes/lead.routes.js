import express from 'express';
import { body } from 'express-validator';
import leadController from '../controllers/lead.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

/**
 * @route   POST /api/leads/process
 * @desc    Process a batch of names for nationality prediction
 * @access  Public
 */
router.post(
    '/process',
    [
        body('names')
            .exists()
            .withMessage('Names are required')
            .custom((value) => {
                if (typeof value === 'string') {
                    return value.trim().length > 0;
                }
                if (Array.isArray(value)) {
                    return value.length > 0;
                }
                return false;
            })
            .withMessage('Names must be a non-empty array or comma-separated string'),
    ],
    validateRequest,
    leadController.processBatch
);

/**
 * @route   GET /api/leads/sync
 * @desc    Manually trigger CRM sync (useful for Vercel Cron Jobs)
 * @access  Public (Should be protected in production)
 */
router.get('/sync', leadController.syncCRM);

/**
 * @route   GET /api/leads
 * @desc    Get all leads with optional filtering
 * @access  Public
 * @query   status - Filter by status (Verified | To Check)
 * @query   batchId - Filter by batch ID
 * @query   syncedToCRM - Filter by sync status (true | false)
 */
router.get('/', leadController.getLeads);

/**
 * @route   GET /api/leads/stats
 * @desc    Get statistics about leads
 * @access  Public
 */
router.get('/stats', leadController.getStats);

/**
 * @route   GET /api/leads/:id
 * @desc    Get a single lead by ID
 * @access  Public
 */
router.get('/:id', leadController.getLeadById);

/**
 * @route   DELETE /api/leads
 * @desc    Delete all leads (development only)
 * @access  Public
 */
router.delete('/', leadController.deleteAll);

export default router;
