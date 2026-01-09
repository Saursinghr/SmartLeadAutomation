import mongoose from 'mongoose';

/**
 * Lead Schema
 * Stores enriched lead data with nationality prediction and verification status
 */
const leadSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [1, 'Name must be at least 1 character'],
            maxlength: [100, 'Name must be less than 100 characters'],
        },
        country: {
            type: String,
            required: [true, 'Country is required'],
            uppercase: true,
            trim: true,
        },
        countryName: {
            type: String,
            default: '',
        },
        probability: {
            type: Number,
            required: [true, 'Probability is required'],
            min: [0, 'Probability must be between 0 and 1'],
            max: [1, 'Probability must be between 0 and 1'],
        },
        status: {
            type: String,
            required: [true, 'Status is required'],
            enum: {
                values: ['Verified', 'To Check'],
                message: 'Status must be either Verified or To Check',
            },
        },
        syncedToCRM: {
            type: Boolean,
            default: false,
            index: true, // Index for efficient querying in background job
        },
        syncedAt: {
            type: Date,
            default: null,
        },
        batchId: {
            type: String,
            default: null,
            index: true, // Index for batch tracking
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                // Format probability as percentage for API responses
                ret.probabilityPercent = Math.round(ret.probability * 100);
                return ret;
            },
        },
    }
);

// Indexes for performance
leadSchema.index({ status: 1, syncedToCRM: 1 }); // Compound index for CRM sync queries
leadSchema.index({ createdAt: -1 }); // Index for sorting by creation date

// Virtual for confidence score as percentage
leadSchema.virtual('confidenceScore').get(function () {
    return Math.round(this.probability * 100);
});

/**
 * Static method to get leads ready for CRM sync
 * Returns verified leads that haven't been synced yet
 */
leadSchema.statics.getLeadsForSync = function () {
    return this.find({
        status: 'Verified',
        syncedToCRM: false,
    }).sort({ createdAt: 1 }); // Oldest first
};

/**
 * Instance method to mark lead as synced
 */
leadSchema.methods.markAsSynced = async function () {
    this.syncedToCRM = true;
    this.syncedAt = new Date();
    return this.save();
};

/**
 * Pre-save hook to ensure data consistency
 */
leadSchema.pre('save', function (next) {
    // Ensure status matches probability threshold
    if (this.isModified('probability')) {
        this.status = this.probability > 0.6 ? 'Verified' : 'To Check';
    }
    next();
});

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;
