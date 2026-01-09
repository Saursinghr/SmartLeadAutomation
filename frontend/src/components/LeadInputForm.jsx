import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { leadAPI } from '@/services/api';
import { Loader2, Sparkles, Users } from 'lucide-react';

/**
 * LeadInputForm Component
 * Allows users to input batch of names for processing
 */
export default function LeadInputForm() {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  // Mutation for processing batch
  const processMutation = useMutation({
    mutationFn: (names) => leadAPI.processBatch(names),
    onSuccess: (data) => {
      // Invalidate and refetch leads
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      // Clear input and error
      setInputValue('');
      setError('');
      
      // Show success message
      console.log('Batch processed successfully:', data);
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to process batch');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate input
    if (!inputValue.trim()) {
      setError('Please enter at least one name');
      return;
    }

    // Clear previous error
    setError('');

    // Process the batch
    processMutation.mutate(inputValue);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (error) setError('');
  };

  return (
    <Card className="gradient-border">
      <div className="bg-card rounded-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Process New Leads</CardTitle>
              <CardDescription>
                Enter names separated by commas (e.g., Peter, Aditi, Ravi, Satoshi)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter names separated by commas..."
                value={inputValue}
                onChange={handleInputChange}
                disabled={processMutation.isPending}
                className="text-base"
              />
              {error && (
                <p className="text-sm text-destructive animate-fade-in">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={processMutation.isPending || !inputValue.trim()}
                className="flex-1 sm:flex-none"
                size="lg"
              >
                {processMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Process Batch
                  </>
                )}
              </Button>

              {processMutation.isSuccess && (
                <div className="text-sm text-green-400 animate-fade-in flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 pulse-dot" />
                  {processMutation.data?.totalProcessed || 0} leads processed successfully!
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </div>
    </Card>
  );
}
