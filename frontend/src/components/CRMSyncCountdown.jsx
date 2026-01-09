import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { leadAPI } from '../services/api';
import { Card, CardContent } from './ui/card';
import { RefreshCw, UserCheck, Clock } from 'lucide-react';

/**
 * CRMSyncCountdown Component
 * Displays a countdown to the next sync and shows the last synced lead
 */
const CRMSyncCountdown = () => {
  const queryClient = useQueryClient();
  
  // Fetch stats using react-query to keep it in sync with other components
  const { data } = useQuery({
    queryKey: ['stats'],
    queryFn: () => leadAPI.getStats(),
  });

  const stats = data?.data;
  const syncIntervalMinutes = stats?.syncInterval || 1;
  const syncIntervalSeconds = syncIntervalMinutes * 60;
  
  const [timeLeft, setTimeLeft] = useState(syncIntervalSeconds);

  useEffect(() => {
    // If interval changes from backend, reset timer
    setTimeLeft(syncIntervalSeconds);
  }, [syncIntervalSeconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Invalidate queries to trigger refresh across the app
          refreshData();
          return syncIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [syncIntervalSeconds]);

  const refreshData = async () => {
    // Invalidate all relevant queries
    queryClient.invalidateQueries({ queryKey: ['stats'] });
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  };

  const lastUser = stats?.lastSyncedLead;

  // Format time display (e.g., 02:45)
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeDisplay = `${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;

  return (
    <Card className="overflow-hidden border-primary/20 bg-primary/5 backdrop-blur-md shadow-xl">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Countdown Section */}
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-primary/10 flex items-center justify-center">
                <Clock className="w-7 h-7 text-primary animate-pulse" />
              </div>
              <svg className="absolute top-0 left-0 w-16 h-16 -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-primary transition-all duration-1000 ease-linear"
                  strokeDasharray={175.93}
                  strokeDashoffset={175.93 - (175.93 * timeLeft) / syncIntervalSeconds}
                />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Next CRM Sync In</p>
              <h3 className="text-3xl font-black font-mono text-primary">
                {timeDisplay}
              </h3>
            </div>
          </div>

          <div className="hidden md:block h-12 w-px bg-border/50" />

          {/* Last Synced User Section */}
          <div className="flex-1 flex items-center gap-4 w-full md:w-auto">
            <div className="p-3 rounded-2xl bg-green-500/10 text-green-500 ring-1 ring-green-500/20">
              <UserCheck className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Last Sent to Sales Team</p>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold truncate text-foreground">
                  {lastUser ? lastUser.name : 'Waiting for first sync...'}
                </h3>
                {lastUser && (
                  <span className="flex h-2 w-2 rounded-full bg-green-500 animate-ping" />
                )}
              </div>
              {lastUser && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/50" />
                  Synced {new Date(lastUser.at).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {/* Action Section */}
          <button 
            onClick={refreshData}
            className="p-3 rounded-xl hover:bg-primary/10 transition-all active:scale-95 group border border-transparent hover:border-primary/20"
            title="Refresh Now"
          >
            <RefreshCw className="w-5 h-5 text-muted-foreground group-hover:text-primary group-active:rotate-180 transition-transform duration-500" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CRMSyncCountdown;
