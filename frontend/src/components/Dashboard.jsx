import React from 'react';
import LeadInputForm from './LeadInputForm';
import LeadsTable from './LeadsTable';
import StatsCards from './StatsCards';
import CRMSyncCountdown from './CRMSyncCountdown';
import { Sparkles } from 'lucide-react';

/**
 * Dashboard Component
 * Main dashboard layout with all components
 */
export default function Dashboard() {
  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">
                Smart Lead Automation
              </h1>
              <p className="text-sm text-muted-foreground">
                AI-Powered Lead Enrichment System
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Sync Status & Countdown */}
        <section className="animate-fade-in">
          <CRMSyncCountdown />
        </section>

        {/* Statistics */}
        <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <StatsCards />
        </section>

        {/* Input Form */}
        <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <LeadInputForm />
        </section>

        {/* Results Table */}
        <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <LeadsTable />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>VR Automations - Developer Test Assignment</p>
            <p className="mt-1">Built with React, Node.js, Express, and MongoDB</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
