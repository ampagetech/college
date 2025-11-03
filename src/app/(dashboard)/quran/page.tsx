"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import TahfizSubNav from '@/components/tahfiz/TahfizSubNav';
import CompactVerseSelector from '@/components/tahfiz/VerseRange';
import RecitationPanel from '@/components/tahfiz/RecitationPanel';
import SimilarVersesPanel from '@/components/tahfiz/SimilarVersesPanel';
import VisualMapPanel from '@/components/tahfiz/VisualMapPanel';
import { Mic, Map, Search } from 'lucide-react';

export interface TahfizSubMenu {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const tahfizSubMenus: TahfizSubMenu[] = [
  {
    id: 'recital',
    name: 'Recital',
    icon: <Mic className="h-4 w-4" />,
    description: 'Practice recitation from memory with AI feedback'
  },
  {
    id: 'similar',
    name: 'Similar Verses',
    icon: <Search className="h-4 w-4" />,
    description: 'Find verses with similar meanings or themes'
  },
  {
    id: 'visual-map',
    name: 'Visual Map',
    icon: <Map className="h-4 w-4" />,
    description: 'Visual representation of Quranic connections'
  }
];

export default function TahfizPage() {
  const [activeSubMenu, setActiveSubMenu] = useState<string>('recital');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renderActivePanel = () => {
    const commonProps = {
      isLoading,
      setIsLoading,
      onError: setError
    };

    switch (activeSubMenu) {
      case 'recital':
        return <RecitationPanel {...commonProps} />;
      case 'similar':
        return <SimilarVersesPanel {...commonProps} />;
      case 'visual-map':
        return <VisualMapPanel {...commonProps} />;
      default:
        return <RecitationPanel {...commonProps} />;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Vertical Sub Navigation Panel */}
      <div className="hidden md:block w-48 flex-shrink-0">
        <TahfizSubNav
          subMenus={tahfizSubMenus}
          activeSubMenu={activeSubMenu}
          onSubMenuChange={setActiveSubMenu}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-4 pb-6 px-4 md:px-6">
        {/* Compact Verse Selector Header */}
        <CompactVerseSelector className="pt-4" />

        {/* Mobile Sub Navigation */}
        <div className="md:hidden">
          <TahfizSubNav
            subMenus={tahfizSubMenus}
            activeSubMenu={activeSubMenu}
            onSubMenuChange={setActiveSubMenu}
          />
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <p>{error}</p>
          </Alert>
        )}

        {/* Active Panel */}
        <Card>
          <CardContent className="p-0">
            {renderActivePanel()}
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center text-gray-400 text-sm py-4">
          © {new Date().getFullYear()} AmpageTech Nig Ltd. All Rights Reserved.
        </footer>
      </div>
    </div>
  );
}