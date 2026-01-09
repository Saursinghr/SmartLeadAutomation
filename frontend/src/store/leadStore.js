import { create } from 'zustand';

/**
 * Lead Store
 * Global state management for leads using Zustand
 */
export const useLeadStore = create((set) => ({
    // State
    leads: [],
    stats: {
        total: 0,
        verified: 0,
        toCheck: 0,
        synced: 0,
        pending: 0,
        lastSyncedLead: null
    },
    filter: 'all', // 'all', 'Verified', 'To Check'
    isLoading: false,
    error: null,
    nextSyncTime: null,

    // Actions
    setLeads: (leads) => set({ leads }),

    setStats: (stats) => set({ stats }),

    setFilter: (filter) => set({ filter }),

    setLoading: (isLoading) => set({ isLoading }),
    
    setNextSyncTime: (time) => set({ nextSyncTime: time }),

    setError: (error) => set({ error }),

    addLeads: (newLeads) => set((state) => ({
        leads: [...newLeads, ...state.leads],
    })),

    clearLeads: () => set({ leads: [] }),

    // Computed values
    getFilteredLeads: () => {
        const { leads, filter } = useLeadStore.getState();
        if (filter === 'all') return leads;
        return leads.filter(lead => lead.status === filter);
    },
}));
