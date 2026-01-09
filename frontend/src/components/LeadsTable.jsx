import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { leadAPI } from '@/services/api';
import { formatDate, formatProbability } from '@/lib/utils';
import { Filter, Loader2, Database, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * LeadsTable Component
 * Displays leads in a table with filtering capabilities
 */
export default function LeadsTable() {
  const [statusFilter, setStatusFilter] = useState('all');

  // Query for fetching leads
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leads', statusFilter],
    queryFn: () => {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      return leadAPI.getLeads(params);
    },
    refetchInterval: 10000, // Refetch every 10 seconds for live updates
  });

  const leads = data?.data || [];

  const getStatusBadge = (status) => {
    if (status === 'Verified') {
      return (
        <Badge variant="success" className="flex items-center gap-1 w-fit">
          <CheckCircle2 className="w-3 h-3" />
          Verified
        </Badge>
      );
    }
    return (
      <Badge variant="warning" className="flex items-center gap-1 w-fit">
        <AlertCircle className="w-3 h-3" />
        To Check
      </Badge>
    );
  };

  const getSyncBadge = (synced) => {
    if (synced) {
      return (
        <Badge variant="secondary" className="text-xs">
          Synced
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs">
        Pending
      </Badge>
    );
  };

  return (
    <Card className="gradient-border">
      <div className="bg-card rounded-lg">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Lead Results</CardTitle>
                <CardDescription>
                  {leads.length} {leads.length === 1 ? 'lead' : 'leads'} found
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'Verified' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('Verified')}
                >
                  Verified
                </Button>
                <Button
                  variant={statusFilter === 'To Check' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('To Check')}
                >
                  To Check
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">Failed to load leads</p>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
                Retry
              </Button>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No leads found. Process a batch to get started!</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>CRM Sync</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead._id} className="animate-fade-in">
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{lead.country === 'US' ? '🇺🇸' : lead.country === 'IN' ? '🇮🇳' : lead.country === 'GB' ? '🇬🇧' : lead.country === 'JP' ? '🇯🇵' : lead.country === 'CN' ? '🇨🇳' : '🌍'}</span>
                          <div>
                            <div className="font-medium">{lead.countryName || lead.country}</div>
                            <div className="text-xs text-muted-foreground">{lead.country}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-secondary rounded-full h-2 max-w-[100px]">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${lead.probability * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {formatProbability(lead.probability)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>{getSyncBadge(lead.syncedToCRM)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
