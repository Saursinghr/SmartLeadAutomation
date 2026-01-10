import cron from 'node-cron';
import Lead from '../models/Lead.model.js';
import { logger } from '../utils/logger.js';

/**
 * CRM Sync Background Job
 * Runs every 5 minutes to sync verified leads to CRM
 * Implements idempotency to prevent duplicate syncs
 */
class CRMSyncJob {
    constructor() {
        this.isRunning = false;
        this.cronExpression = '*/1 * * * *'; // Every 1 minute
        this.task = null;
    }

    /**
     * Start the scheduled job
     */
    start() {
        // Check if CRM sync is enabled
        if (process.env.CRM_SYNC_ENABLED === 'false') {
            logger.info('CRM Sync job is disabled via environment variable');
            return;
        }

        // Use custom interval if provided
        const interval = parseInt(process.env.CRM_SYNC_INTERVAL) || 1;
        this.cronExpression = `*/${interval} * * * *`;

        logger.info(`🚀 Starting CRM Sync job (runs every ${interval} minutes)`);

        // Schedule the job
        this.task = cron.schedule(this.cronExpression, async () => {
            await this.execute();
        });

        logger.info('✅ CRM Sync job scheduled successfully');
    }

    /**
     * Stop the scheduled job
     */
    stop() {
        if (this.task) {
            this.task.stop();
            logger.info('⏹️  CRM Sync job stopped');
        }
    }

    /**
     * Execute manual sync (for serverless environments like Vercel)
     */
    async executeManual() {
        return await this.execute();
    }

    /**
     * Execute the sync process
     * This is the main logic that runs on schedule
     */
    async execute() {
        // Prevent concurrent executions
        if (this.isRunning) {
            logger.warn('⚠️  CRM Sync job is already running, skipping this execution');
            return;
        }

        this.isRunning = true;
        const startTime = Date.now();

        try {
            logger.info('🔄 Starting CRM Sync process...');

            // Step 1: Find verified leads that haven't been synced yet
            // This query ensures idempotency - we only get leads that need syncing
            const leadsToSync = await Lead.getLeadsForSync();

            if (leadsToSync.length === 0) {
                logger.info('ℹ️  No verified leads to sync at this time');
                return;
            }

            logger.info(`📊 Found ${leadsToSync.length} verified leads to sync`);

            // Step 2: Process each lead
            const syncResults = {
                successful: 0,
                failed: 0,
                errors: [],
            };

            for (const lead of leadsToSync) {
                try {
                    // Step 3: Simulate CRM sync (as per assignment requirements)
                    // In production, this would be an actual API call to the CRM
                    await this.syncToCRM(lead);

                    // Step 4: Mark lead as synced (ensures idempotency)
                    await lead.markAsSynced();

                    syncResults.successful++;
                } catch (error) {
                    logger.error(`Failed to sync lead ${lead.name}:`, error);
                    syncResults.failed++;
                    syncResults.errors.push({
                        leadId: lead._id,
                        leadName: lead.name,
                        error: error.message,
                    });
                }
            }

            // Step 5: Log summary
            const duration = Date.now() - startTime;
            logger.info(
                `✅ CRM Sync completed in ${duration}ms - ` +
                `Successful: ${syncResults.successful}, Failed: ${syncResults.failed}`
            );

            if (syncResults.failed > 0) {
                logger.warn('⚠️  Some leads failed to sync:', syncResults.errors);
            }
        } catch (error) {
            logger.error('❌ CRM Sync job failed:', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Simulate sending lead to CRM
     * In production, this would make an actual API call
     * @param {Object} lead - Lead document to sync
     */
    async syncToCRM(lead) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Log to console as per assignment requirements
        logger.crmSync(lead.name);

        // In production, you would do something like:
        // await axios.post(CRM_API_URL, {
        //   name: lead.name,
        //   country: lead.country,
        //   probability: lead.probability,
        //   status: lead.status,
        // });
    }

    /**
     * Manually trigger the sync process (for testing)
     */
    async triggerManually() {
        logger.info('🔧 Manually triggering CRM Sync...');
        await this.execute();
    }
}

// Export singleton instance
const crmSyncJob = new CRMSyncJob();
export default crmSyncJob;
