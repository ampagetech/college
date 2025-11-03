"use client";

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type SchemeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialId: string;
  onNavigate: (direction: 'next' | 'prev') => void;
};

type SchemeDetail = {
  id: string;
  nigerian_level: string;
  subject: string;
  term: string;
  week: number | null;
  topic_long: string | null;
  content: string | null;
  activity: string | null;
};

export const SchemeModal: React.FC<SchemeModalProps> = ({ 
  isOpen, 
  onClose, 
  initialId,
  onNavigate
}) => {
  const [schemeDetail, setSchemeDetail] = useState<SchemeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchemeDetail = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/scheme-modal?id=${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.data) {
        throw new Error('No data received');
      }
      
      setSchemeDetail(result.data);
    } catch (error) {
      console.error('Error fetching scheme detail:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && initialId) {
      fetchSchemeDetail(initialId);
    }
  }, [isOpen, initialId]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl mx-auto my-auto max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b pb-4 bg-white">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Scheme Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            <h3 className="font-bold">Error loading details</h3>
            <p>{error}</p>
          </div>
        ) : schemeDetail ? (
          <div className="space-y-4 p-4 bg-white">
            {/* First row - 4 columns */}
            <div className="grid grid-cols-4 gap-4">
              <DetailRow label="ID" value={schemeDetail.id} />
              <DetailRow label="Level" value={schemeDetail.nigerian_level} />
              <DetailRow label="Term" value={schemeDetail.term} />
              <DetailRow label="Week" value={schemeDetail.week?.toString() || 'N/A'} />
            </div>

            {/* Subject - Full width */}
            <div className="w-full">
              <DetailRow label="Subject" value={schemeDetail.subject} />
            </div>

            {/* Topic - Full width */}
            {schemeDetail.topic_long && (
              <div className="w-full bg-gray-50 p-4 rounded-md">
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Topic</h3>
                <p className="text-gray-800">{schemeDetail.topic_long}</p>
              </div>
            )}

            {/* Content - Full width multiline */}
            {schemeDetail.content && (
              <div className="w-full bg-gray-50 p-4 rounded-md">
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Content</h3>
                <p className="text-gray-800 whitespace-pre-wrap">{schemeDetail.content}</p>
              </div>
            )}

            {/* Activity - Full width multiline */}
            {schemeDetail.activity && (
              <div className="w-full bg-gray-50 p-4 rounded-md">
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Activity</h3>
                <p className="text-gray-800 whitespace-pre-wrap">{schemeDetail.activity}</p>
              </div>
            )}
          </div>
        ) : null}

        <div className="flex justify-between items-center border-t pt-4 bg-white">
          <Button 
            variant="outline" 
            onClick={() => onNavigate('prev')}
            disabled={isLoading}
          >
            <ChevronLeft className="mr-2" /> Previous
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onNavigate('next')}
            disabled={isLoading}
          >
            Next <ChevronRight className="ml-2" />
          </Button>
          <Button 
            variant="destructive" 
            onClick={onClose}
          >
            <X className="mr-2" /> Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper component for consistent detail row display
const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-gray-50 p-3 rounded-md">
    <span className="text-sm text-gray-600 block">{label}</span>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);

export default SchemeModal;