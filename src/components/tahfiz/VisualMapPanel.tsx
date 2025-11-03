// src/components/tahfiz/VisualMapPanel.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Map, Network, BookOpen, Loader2, ZoomIn, Download } from 'lucide-react';
import { useVerseSelectionStore } from '@/stores/verseSelectionStore';

interface VisualMapPanelProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

type MapType = 'thematic' | 'chronological' | 'linguistic' | 'structural';

interface Connection {
  id: string;
  sourceVerse: string;
  targetVerse: string;
  connectionType: string;
  strength: number;
  description: string;
}

interface MapNode {
  id: string;
  chapter: number;
  verse: number;
  chapterName: string;
  text: string;
  theme: string;
  connections: Connection[];
}

const VisualMapPanel: React.FC<VisualMapPanelProps> = ({
  isLoading,
  setIsLoading,
  onError
}) => {
  const { selectedRange } = useVerseSelectionStore();
  const [mapType, setMapType] = useState<MapType>('thematic');
  const [mapData, setMapData] = useState<MapNode[]>([]);
  const [mapGenerated, setMapGenerated] = useState(false);

  const mapTypes = [
    { id: 'thematic', name: 'Thematic Map', description: 'Group by themes and topics' },
    { id: 'chronological', name: 'Chronological Map', description: 'Order by revelation sequence' },
    { id: 'linguistic', name: 'Linguistic Map', description: 'Connect by word patterns' },
    { id: 'structural', name: 'Structural Map', description: 'Show verse relationships' }
  ];

  // Clear results when verse range changes
  useEffect(() => {
    setMapData([]);
    setMapGenerated(false);
    onError(null);
  }, [selectedRange, onError]);

  // Mock function to generate visual map
  const generateVisualMap = async () => {
    setIsLoading(true);
    onError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock map data
      const mockMapData: MapNode[] = [
        {
          id: '1',
          chapter: 1,
          verse: 1,
          chapterName: 'Al-Fatihah',
          text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          theme: 'Divine Names',
          connections: [
            {
              id: 'c1',
              sourceVerse: '1:1',
              targetVerse: '17:110',
              connectionType: 'Thematic',
              strength: 90,
              description: 'Both mention Rahman and Raheem'
            }
          ]
        },
        {
          id: '2',
          chapter: 1,
          verse: 2,
          chapterName: 'Al-Fatihah',
          text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
          theme: 'Praise to Allah',
          connections: [
            {
              id: 'c2',
              sourceVerse: '1:2',
              targetVerse: '6:45',
              connectionType: 'Linguistic',
              strength: 75,
              description: 'Similar praise structure'
            }
          ]
        }
      ];

      setMapData(mockMapData);
      setMapGenerated(true);

    } catch (error) {
      console.error('Error generating visual map:', error);
      onError('Failed to generate visual map. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format range display
  const formatSelectedRange = () => {
    const { startChapter, startVerse, endChapter, endVerse } = selectedRange;
    if (startChapter === endChapter) {
      return `${startChapter}:${startVerse}-${endVerse}`;
    }
    return `${startChapter}:${startVerse} - ${endChapter}:${endVerse}`;
  };

  // Get connection strength color
  const getConnectionColor = (strength: number) => {
    if (strength >= 80) return 'bg-green-500';
    if (strength >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Visual Map</h3>
          <p className="text-sm text-gray-600">
            Visualize connections for {formatSelectedRange()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={mapType} onValueChange={(value: MapType) => setMapType(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mapTypes.map(type => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={generateVisualMap}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Map className="h-4 w-4" />
                Generate Map
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Map Type Description */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Network className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-gray-900">
              {mapTypes.find(t => t.id === mapType)?.name}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {mapTypes.find(t => t.id === mapType)?.description}
          </p>
        </CardContent>
      </Card>

      {/* Visual Map Results */}
      {mapGenerated && mapData.length > 0 && (
        <div className="space-y-6">
          {/* Map Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Connection Map ({mapData.length} nodes)
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <ZoomIn className="h-4 w-4 mr-2" />
                    Zoom
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mock Visual Map Display */}
              <div className="bg-gray-50 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <Network className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Interactive Map Visualization</p>
                  <p className="text-sm text-gray-500">
                    This would show an interactive network graph of verse connections
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connection Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Connection Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mapData.map((node) => (
                <div key={node.id} className="border rounded-lg p-4">
                  {/* Node Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {node.chapterName} {node.chapter}:{node.verse}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {node.theme}
                      </Badge>
                    </div>
                  </div>

                  {/* Arabic Text */}
                  <div className="bg-green-50 p-3 rounded-lg mb-3">
                    <p className="text-lg font-arabic leading-relaxed text-right text-green-800">
                      {node.text}
                    </p>
                  </div>

                  {/* Connections */}
                  {node.connections.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-700">
                        Connections ({node.connections.length})
                      </h5>
                      {node.connections.map((connection) => (
                        <div key={connection.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getConnectionColor(connection.strength)}`}></div>
                            <span className="text-sm text-gray-700">
                              → {connection.targetVerse}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {connection.connectionType}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {connection.strength}% match
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connection Strength Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700">Strong (80%+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-gray-700">Medium (60-79%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-700">Weak (Below 60%)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {mapGenerated && mapData.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Map className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Connections Found</h3>
            <p className="text-gray-600 mb-4">
              No meaningful connections were found for the selected verses using the {mapTypes.find(t => t.id === mapType)?.name.toLowerCase()}.
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={generateVisualMap} variant="outline">
                Try Again
              </Button>
              <Select value={mapType} onValueChange={(value: MapType) => setMapType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mapTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!mapGenerated && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Map className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Visual Map</h3>
            <p className="text-gray-600 mb-4">
              Create an interactive visualization showing connections between verses based on the selected mapping type.
            </p>
            <Button onClick={generateVisualMap} className="bg-blue-600 hover:bg-blue-700">
              <Map className="h-4 w-4 mr-2" />
              Generate {mapTypes.find(t => t.id === mapType)?.name}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VisualMapPanel;