import leadService from '../services/lead.service.js';
import { logger } from '../utils/logger.js';

/**
 * Lead Controller
 * Handles HTTP requests for lead management
 */
class LeadController {
    /**
     * Process a batch of names
     * POST /api/leads/process
     * Body: { names: string[] } or { names: string } (comma-separated)
     */
    async processBatch(req, res, next) {
        try {
            let { names } = req.body;

            // Validate request body
            if (!names) {
                return res.status(400).json({
                    success: false,
                    error: 'Names are required',
                    message: 'Please provide a names array or comma-separated string',
                });
            }

            // Handle both array and comma-separated string formats
            let namesArray;
            if (typeof names === 'string') {
                // Split by comma and clean up
                namesArray = names
                    .split(',')
                    .map(name => name.trim())
                    .filter(name => name.length > 0);
            } else if (Array.isArray(names)) {
                namesArray = names;
            } else {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid names format',
                    message: 'Names must be an array or comma-separated string',
                });
            }

            // Validate we have names to process
            if (namesArray.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No valid names provided',
                    message: 'Please provide at least one name',
                });
            }

            // Limit batch size to prevent abuse
            if (namesArray.length > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Batch size too large',
                    message: 'Maximum 100 names per batch',
                });
            }

            logger.info(`Received batch processing request for ${namesArray.length} names`);

            // Process the batch
            const result = await leadService.processBatch(namesArray);

            // Return success response
            res.status(201).json({
                success: true,
                message: `Successfully processed ${result.totalProcessed} leads`,
                data: result,
            });
        } catch (error) {
            logger.error('Error in processBatch controller:', error);
            next(error);
        }
    }

    /**
     * Get all leads with optional filtering
     * GET /api/leads?status=Verified&batchId=xxx
     */
    async getLeads(req, res, next) {
        try {
            const { status, batchId, syncedToCRM } = req.query;

            // Build filters
            const filters = {};
            if (status) {
                // Validate status value
                if (!['Verified', 'To Check'].includes(status)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid status',
                        message: 'Status must be either "Verified" or "To Check"',
                    });
                }
                filters.status = status;
            }

            if (batchId) {
                filters.batchId = batchId;
            }

            if (syncedToCRM !== undefined) {
                filters.syncedToCRM = syncedToCRM === 'true';
            }

            logger.info('Fetching leads with filters:', filters);

            const leads = await leadService.getLeads(filters);

            res.status(200).json({
                success: true,
                count: leads.length,
                data: leads,
            });
        } catch (error) {
            logger.error('Error in getLeads controller:', error);
            next(error);
        }
    }

    /**
     * Get a single lead by ID
     * GET /api/leads/:id
     */
    async getLeadById(req, res, next) {
        try {
            const { id } = req.params;

            const lead = await leadService.getLeadById(id);

            res.status(200).json({
                success: true,
                data: lead,
            });
        } catch (error) {
            logger.error('Error in getLeadById controller:', error);

            if (error.message === 'Lead not found') {
                return res.status(404).json({
                    success: false,
                    error: 'Lead not found',
                    message: `No lead found with ID: ${req.params.id}`,
                });
            }

            next(error);
        }
    }

    /**
     * Get statistics
     * GET /api/leads/stats
     */
    async getStats(req, res, next) {
        try {
            const stats = await leadService.getStats();

            res.status(200).json({
                success: true,
                data: stats,
            });
        } catch (error) {
            logger.error('Error in getStats controller:', error);
            next(error);
        }
    }

    /**
     * Delete all leads (for testing)
     * DELETE /api/leads
     */
    async deleteAll(req, res, next) {
        try {
            // Only allow in development
            if (process.env.NODE_ENV === 'production') {
                return res.status(403).json({
                    success: false,
                    error: 'Operation not allowed in production',
                });
            }

            const result = await leadService.deleteAll();

            res.status(200).json({
                success: true,
                message: `Deleted ${result.deletedCount} leads`,
                data: result,
            });
        } catch (error) {
            logger.error('Error in deleteAll controller:', error);
            next(error);
        }
    }
}

export default new LeadController();
