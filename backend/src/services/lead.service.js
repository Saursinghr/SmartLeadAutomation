import Lead from '../models/Lead.model.js';
import nationalizeService from './nationalize.service.js';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';

/**
 * Lead Service
 * Business logic for lead processing, enrichment, and management
 */
class LeadService {
    /**
     * Process a batch of names: enrich with nationality data and store
     * @param {string[]} names - Array of names to process
     * @returns {Promise<Object>} Processing results with created leads
     */
    async processBatch(names) {
        try {
            // Validate input
            if (!names || !Array.isArray(names) || names.length === 0) {
                throw new Error('Names array is required and must not be empty');
            }

            // Clean and deduplicate names
            const cleanedNames = [...new Set(
                names
                    .map(name => name.trim())
                    .filter(name => name.length > 0)
            )];

            if (cleanedNames.length === 0) {
                throw new Error('No valid names provided after cleaning');
            }

            logger.info(`Processing batch of ${cleanedNames.length} unique names`);

            // Generate batch ID for tracking
            const batchId = randomUUID();

            // Step 1: Enrich names with nationality data (parallel processing)
            const predictions = await nationalizeService.predictBatch(cleanedNames);

            // Step 2: Apply business logic and prepare lead documents
            const leadDocuments = predictions.map(prediction => ({
                name: prediction.name,
                country: prediction.country,
                countryName: prediction.countryName,
                probability: prediction.probability,
                status: this.determineStatus(prediction.probability),
                batchId,
                syncedToCRM: false,
            }));

            // Step 3: Bulk insert into database for efficiency
            const createdLeads = await Lead.insertMany(leadDocuments, {
                ordered: false, // Continue on error
            });

            logger.info(`Successfully created ${createdLeads.length} leads in batch ${batchId}`);

            // Step 4: Return summary statistics
            const stats = this.calculateBatchStats(createdLeads);

            return {
                success: true,
                batchId,
                totalProcessed: createdLeads.length,
                stats,
                leads: createdLeads,
            };
        } catch (error) {
            logger.error('Error processing batch:', error);
            throw error;
        }
    }

    /**
     * Determine lead status based on probability threshold
     * Business Rule: > 60% = Verified, <= 60% = To Check
     * @param {number} probability - Confidence score (0-1)
     * @returns {string} Status: 'Verified' or 'To Check'
     */
    determineStatus(probability) {
        return probability > 0.6 ? 'Verified' : 'To Check';
    }

    /**
     * Calculate statistics for a batch of leads
     * @param {Array} leads - Array of lead documents
     * @returns {Object} Statistics object
     */
    calculateBatchStats(leads) {
        const verified = leads.filter(lead => lead.status === 'Verified').length;
        const toCheck = leads.filter(lead => lead.status === 'To Check').length;
        const avgProbability = leads.reduce((sum, lead) => sum + lead.probability, 0) / leads.length;

        return {
            verified,
            toCheck,
            averageConfidence: Math.round(avgProbability * 100),
        };
    }

    /**
     * Get all leads with optional filtering
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Array>} Array of leads
     */
    async getLeads(filters = {}) {
        try {
            const query = {};

            // Apply status filter
            if (filters.status) {
                query.status = filters.status;
            }

            // Apply batch filter
            if (filters.batchId) {
                query.batchId = filters.batchId;
            }

            // Apply sync status filter
            if (filters.syncedToCRM !== undefined) {
                query.syncedToCRM = filters.syncedToCRM;
            }

            const leads = await Lead.find(query)
                .sort({ createdAt: -1 }) // Newest first
                .lean();

            return leads;
        } catch (error) {
            logger.error('Error fetching leads:', error);
            throw error;
        }
    }

    /**
     * Get a single lead by ID
     * @param {string} id - Lead ID
     * @returns {Promise<Object>} Lead document
     */
    async getLeadById(id) {
        try {
            const lead = await Lead.findById(id);
            if (!lead) {
                throw new Error('Lead not found');
            }
            return lead;
        } catch (error) {
            logger.error(`Error fetching lead ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get overall statistics
     * @returns {Promise<Object>} Statistics object
     */
    async getStats() {
        try {
            const [total, verified, toCheck, synced, lastSyncedLead] = await Promise.all([
                Lead.countDocuments(),
                Lead.countDocuments({ status: 'Verified' }),
                Lead.countDocuments({ status: 'To Check' }),
                Lead.countDocuments({ syncedToCRM: true }),
                Lead.findOne({ syncedToCRM: true }).sort({ updatedAt: -1 }).select('name updatedAt'),
            ]);

            return {
                total,
                verified,
                toCheck,
                synced,
                pending: verified - synced,
                lastSyncedLead: lastSyncedLead ? {
                    name: lastSyncedLead.name,
                    at: lastSyncedLead.updatedAt
                } : null
            };
        } catch (error) {
            logger.error('Error fetching stats:', error);
            throw error;
        }
    }

    /**
     * Delete all leads (for testing purposes)
     * @returns {Promise<Object>} Deletion result
     */
    async deleteAll() {
        try {
            const result = await Lead.deleteMany({});
            logger.info(`Deleted ${result.deletedCount} leads`);
            return result;
        } catch (error) {
            logger.error('Error deleting leads:', error);
            throw error;
        }
    }
}

export default new LeadService();
