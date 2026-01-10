import axios from 'axios';
import { logger } from '../utils/logger.js';

/**
 * Nationalize.io API Service
 * Handles API integration with rate limiting and error handling
 */
class NationalizeService {
    constructor() {
        // Ensure the base URL is clean and has no trailing slash initially for consistency
        let envURL = process.env.NATIONALIZE_API_URL || 'https://api.nationalize.io';
        this.baseURL = envURL.endsWith('/') ? envURL : `${envURL}/`;
        
        this.rateLimit = parseInt(process.env.API_RATE_LIMIT) || 10;
        this.maxBatchSize = 10; // Nationalize.io limit for batch requests
        this.requestQueue = [];
        this.processing = false;
        
        // Common headers for API requests
        this.headers = {
            'Accept': 'application/json',
            'User-Agent': 'SmartLeadAutomation/1.0.0 (Lead Processing System)'
        };
    }

    /**
     * Helper to wait for a specified time
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Make API request with retry logic for 429 errors
     */
    async fetchWithRetry(params, retries = 3, backoff = 2000) {
        try {
            const response = await axios.get(this.baseURL, {
                params,
                headers: this.headers,
                timeout: 15000,
                // Ensure array params are formatted as name[]=...
                paramsSerializer: {
                    indexes: null // this will result in name=val1&name=val2 or name[]=val1&name[]=val2 depending on the key
                }
            });
            return response.data;
        } catch (error) {
            if (error.response?.status === 429 && retries > 0) {
                logger.warn(`Rate limit hit (429). Retrying in ${backoff}ms... (${retries} retries left)`);
                await this.sleep(backoff);
                return this.fetchWithRetry(params, retries - 1, backoff * 2);
            }
            throw error;
        }
    }

    /**
     * Process a single result into our lead format
     */
    formatResult(data) {
        if (!data || !data.country || data.country.length === 0) {
            return {
                name: data?.name || 'Unknown',
                country: 'UNKNOWN',
                countryName: 'Unknown',
                probability: 0,
            };
        }

        const mostLikely = data.country.reduce((prev, current) => {
            return current.probability > prev.probability ? current : prev;
        });

        return {
            name: data.name,
            country: mostLikely.country_id,
            countryName: this.getCountryName(mostLikely.country_id),
            probability: mostLikely.probability,
        };
    }

    /**
     * Get nationality prediction for a single name
     * @param {string} name - The name to predict nationality for
     * @returns {Promise<Object>} Prediction result with country and probability
     */
    async predictNationality(name) {
        const trimmedName = name.trim();
        try {
            logger.info(`Predicting nationality for: ${trimmedName}`);
            const data = await this.fetchWithRetry({ name: trimmedName });
            return this.formatResult(data);
        } catch (error) {
            const errorMsg = error.response ? 
                `API Error (${error.response.status}): ${JSON.stringify(error.response.data)}` : 
                `Request Error: ${error.message}`;
            
            logger.error(`Error predicting nationality for ${trimmedName}: ${errorMsg}`);

            return {
                name: trimmedName,
                country: 'ERROR',
                countryName: 'Error',
                probability: 0,
                errorMessage: errorMsg,
            };
        }
    }

    /**
     * Process batch of names using Nationalize.io's batch feature
     * @param {string[]} names - Array of names to process
     * @returns {Promise<Object[]>} Array of prediction results
     */
    async predictBatch(names) {
        logger.info(`Processing batch of ${names.length} names using Nationalize Batch API`);

        const results = [];
        // Process in chunks of 10 (API limit for batch)
        for (let i = 0; i < names.length; i += this.maxBatchSize) {
            const chunk = names.slice(i, i + this.maxBatchSize);
            logger.info(`Processing chunk ${Math.floor(i / this.maxBatchSize) + 1}/${Math.ceil(names.length / this.maxBatchSize)}`);
            
            try {
                // Nationalize batch API uses multiple 'name' parameters or 'name[]'
                // axios paramsSerializer will handle this
                const data = await this.fetchWithRetry({ 'name[]': chunk });
                
                // Response is an array of objects
                const chunkResults = Array.isArray(data) 
                    ? data.map(item => this.formatResult(item))
                    : [this.formatResult(data)]; // Fallback for single result
                
                results.push(...chunkResults);
            } catch (error) {
                logger.error(`Chunk processing failed: ${error.message}`);
                // Add error results for this chunk
                results.push(...chunk.map(name => ({
                    name,
                    country: 'ERROR',
                    countryName: 'Error',
                    probability: 0,
                    errorMessage: error.message
                })));
            }

            // Small delay between chunks to be safe
            if (i + this.maxBatchSize < names.length) {
                await this.sleep(1000);
            }
        }

        const successCount = results.filter(p => p.country !== 'ERROR' && p.country !== 'UNKNOWN').length;
        logger.info(`Batch processing complete: ${successCount}/${names.length} successful`);

        return results;
    }

    /**
     * Get full country name from country code
     * @param {string} countryCode - ISO 3166-1 alpha-2 country code
     * @returns {string} Full country name
     */
    getCountryName(countryCode) {
        const countryNames = {
            US: 'United States',
            IN: 'India',
            GB: 'United Kingdom',
            CN: 'China',
            JP: 'Japan',
            DE: 'Germany',
            FR: 'France',
            BR: 'Brazil',
            IT: 'Italy',
            CA: 'Canada',
            ES: 'Spain',
            AU: 'Australia',
            MX: 'Mexico',
            KR: 'South Korea',
            RU: 'Russia',
            NL: 'Netherlands',
            SE: 'Sweden',
            PL: 'Poland',
            BE: 'Belgium',
            CH: 'Switzerland',
            AT: 'Austria',
            NO: 'Norway',
            DK: 'Denmark',
            FI: 'Finland',
            IE: 'Ireland',
            PT: 'Portugal',
            GR: 'Greece',
            CZ: 'Czech Republic',
            RO: 'Romania',
            HU: 'Hungary',
            // Add more as needed
        };

        return countryNames[countryCode] || countryCode;
    }

    /**
     * Health check for the Nationalize API
     * @returns {Promise<boolean>} True if API is accessible
     */
    async healthCheck() {
        try {
            await axios.get(this.baseURL, {
                params: { name: 'test' },
                timeout: 5000,
            });
            return true;
        } catch (error) {
            logger.error('Nationalize API health check failed:', error);
            return false;
        }
    }
}

export default new NationalizeService();
