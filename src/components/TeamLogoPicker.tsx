import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface LogoFile {
  name: string;
  url: string;
  league: string;
}

interface TeamLogoPickerProps {
  selectedUrl?: string;
  onSelect: (url: string) => void;
}

// Simple in-memory cache
let logoCache: LogoFile[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const TeamLogoPicker: React.FC<TeamLogoPickerProps> = ({ 
  selectedUrl, 
  onSelect 
}) => {
  const [logos, setLogos] = useState<LogoFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchLogos = async () => {
      try {
        // Check cache first
        const now = Date.now();
        if (logoCache && (now - cacheTimestamp) < CACHE_DURATION) {
          setLogos(logoCache);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        // Fetch from Supabase Storage - get root directories (leagues)
        const { data: root, error: rootError } = await supabase.storage
          .from('logos')
          .list('', { limit: 1000 });

        if (rootError) {
          throw new Error(`Failed to fetch root directory: ${rootError.message}`);
        }

        // Build leagues array
        const leagues = await Promise.all(
          (root ?? [])
            .filter(i => !i.name.includes('.')) // Filter out files, keep directories
            .map(async dir => {
              const { data: logos } = await supabase
                .storage
                .from('logos')
                .list(dir.name, { limit: 1000 });
              
              return {
                league: dir.name, // e.g. 'La Liga'
                logos: (logos ?? [])
                  .filter(l => l.name.endsWith('.svg'))
                  .map(l => {
                    const encoded = `${encodeURIComponent(dir.name)}/${encodeURIComponent(l.name)}`;
                    const { data } = supabase.storage.from('logos').getPublicUrl(encoded);
                    return {
                      name: l.name
                        .replace('.svg', '')
                        .replace(/-/g, ' ')
                        .replace(/\b\w/g, c => c.toUpperCase()), // 'real-madrid' → 'Real Madrid'
                      url: data.publicUrl,
                    };
                  }),
              };
            }),
        );

        // Flatten into LogoFile array for backward compatibility
        const logoFiles: LogoFile[] = [];
        for (const league of leagues) {
          for (const logo of league.logos) {
            logoFiles.push({
              name: logo.name,
              url: logo.url,
              league: league.league,
            });
          }
        }

        // Update cache
        logoCache = logoFiles;
        cacheTimestamp = now;

        setLogos(logoFiles);
      } catch (err) {
        console.error('Error fetching logos:', err);
        setError(err instanceof Error ? err.message : 'Failed to load logos');
      } finally {
        setLoading(false);
      }
    };

    fetchLogos();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        <p className="mt-2 text-sm text-gray-600">Loading logos…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>Failed to load logos: {error}</p>
      </div>
    );
  }

  if (logos.length === 0) {
    return (
      <div className="p-4 text-center text-gray-600">
        <p>No logos found</p>
      </div>
    );
  }

  // Group logos by league
  const logosByLeague = logos.reduce((acc, logo) => {
    if (!acc[logo.league]) {
      acc[logo.league] = [];
    }
    acc[logo.league].push(logo);
    return acc;
  }, {} as Record<string, LogoFile[]>);

  const leagues = Object.keys(logosByLeague).sort();

  const toggleLeague = (league: string) => {
    const newExpanded = new Set(expandedLeagues);
    if (newExpanded.has(league)) {
      newExpanded.delete(league);
    } else {
      newExpanded.add(league);
    }
    setExpandedLeagues(newExpanded);
  };

  return (
    <div className="w-full">
      {/* League accordion */}
      {leagues.map((league) => (
        <div key={league} className="border-b border-gray-200">
          <button
            onClick={() => toggleLeague(league)}
            className="w-full px-4 py-3 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="font-medium text-gray-900">{league}</span>
            <svg
              className={`w-4 h-4 transition-transform ${
                expandedLeagues.has(league) ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedLeagues.has(league) && (
            <div className="p-4 bg-white">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {logosByLeague[league]?.map((logo) => (
                  <button
                    key={logo.url}
                    onClick={() => onSelect(logo.url)}
                    className={`relative p-2 rounded-lg border-2 transition-all hover:shadow-md ${
                      selectedUrl === logo.url
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={logo.name}
                  >
                    <img
                      src={logo.url}
                      alt={logo.name}
                      className="w-full h-12 object-contain"
                      loading="lazy"
                    />
                    {selectedUrl === logo.url && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                )) || []}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
