import axios from 'axios';
import { logger } from '../utils/logger.js';

/**
 * Nationalize.io API Service
 * Handles API integration with rate limiting and error handling
 */
class NationalizeService {
    constructor() {
        this.baseURL = process.env.NATIONALIZE_API_URL || 'https://api.nationalize.io';
        this.rateLimit = parseInt(process.env.API_RATE_LIMIT) || 10;
        this.requestQueue = [];
        this.processing = false;
    }

    /**
     * Get nationality prediction for a single name
     * @param {string} name - The name to predict nationality for
     * @returns {Promise<Object>} Prediction result with country and probability
     */
    async predictNationality(name) {
        try {
            logger.info(`Predicting nationality for: ${name}`);
            const response = await axios.get(this.baseURL, {
                params: { name: name.trim() },
                timeout: 15000, // Increased to 15 seconds for production stability
            });

            const data = response.data;

            // Log raw response for debugging in Render
            logger.debug(`API Response for ${name}:`, JSON.stringify(data));

            // Handle case where no predictions are returned
            if (!data.country || data.country.length === 0) {
                logger.warn(`No nationality predictions found for name: ${name}`);
                return {
                    name,
                    country: 'UNKNOWN',
                    countryName: 'Unknown',
                    probability: 0,
                };
            }

            // Get the most likely country (highest probability)
            const mostLikely = data.country.reduce((prev, current) => {
                return current.probability > prev.probability ? current : prev;
            });

            return {
                name,
                country: mostLikely.country_id,
                countryName: this.getCountryName(mostLikely.country_id),
                probability: mostLikely.probability,
            };
        } catch (error) {
            const errorMsg = error.response ? 
                `API Error (${error.response.status}): ${JSON.stringify(error.response.data)}` : 
                `Network/Timeout Error: ${error.message}`;
            
            logger.error(`Error predicting nationality for ${name}: ${errorMsg}`);

            // Return default values on error to prevent batch failure
            return {
                name,
                country: 'ERROR',
                countryName: 'Error',
                probability: 0,
                errorMessage: errorMsg, // Adding more detail for debugging
            };
        }
    }

    /**
     * Process batch of names with controlled concurrency
     * Implements Promise.all for parallel processing while respecting rate limits
     * @param {string[]} names - Array of names to process
     * @returns {Promise<Object[]>} Array of prediction results
     */
    async predictBatch(names) {
        logger.info(`Processing batch of ${names.length} names`);

        try {
            // Process all names in parallel using Promise.all
            // This is efficient and the API can handle concurrent requests
            const predictions = await Promise.all(
                names.map(name => this.predictNationality(name))
            );

            const successCount = predictions.filter(p => !p.error).length;
            logger.info(`Batch processing complete: ${successCount}/${names.length} successful`);

            return predictions;
        } catch (error) {
            logger.error('Batch processing failed:', error);
            throw new Error('Failed to process batch of names');
        }
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
