import { useEffect, useMemo, useState } from 'react';
import SearchToolbar, { SearchQuery } from '../components/search/SearchToolbar';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';

interface MediaItem {
  id: number;
  title: string;
  type: string;
  date: string;
  location: string;
  collections: string[];
  tags: string[];
  people: string[];
  thumbnailColor: string;
}

const MOCK_MEDIA: MediaItem[] = [
  {
    id: 1,
    title: 'Family Picnic 1999',
    type: 'photo',
    date: '1999-06-14',
    location: 'Denver, CO',
    collections: ['Family Album'],
    tags: ['outdoors', 'summer'],
    people: ['Alice', 'Bob'],
    thumbnailColor: 'bg-violet-200',
  },
  {
    id: 2,
    title: 'Interview with Grandma',
    type: 'audio',
    date: '2004-11-02',
    location: 'Kansas City, MO',
    collections: ['Oral Histories'],
    tags: ['family'],
    people: ['Grandma Ruth'],
    thumbnailColor: 'bg-amber-200',
  },
  {
    id: 3,
    title: 'Super 8 Road Trip',
    type: 'video',
    date: '1985-08-22',
    location: 'Route 66',
    collections: ['Travel Reels'],
    tags: ['roadtrip', 'vintage'],
    people: ['Alice', 'Charlie'],
    thumbnailColor: 'bg-blue-200',
  },
  {
    id: 4,
    title: 'Newspaper Clipping - Moon Landing',
    type: 'document',
    date: '1969-07-21',
    location: 'Houston, TX',
    collections: ['Historical Clippings'],
    tags: ['space', 'nasa'],
    people: [],
    thumbnailColor: 'bg-stone-200',
  },
  {
    id: 5,
    title: 'Wedding Ceremony Tape',
    type: 'video',
    date: '1978-05-06',
    location: 'Portland, OR',
    collections: ['Family Album'],
    tags: ['wedding'],
    people: ['Alice', 'Dan'],
    thumbnailColor: 'bg-rose-200',
  },
  {
    id: 6,
    title: 'Letters from Uncle Sam',
    type: 'document',
    date: '1944-02-15',
    location: 'Paris, France',
    collections: ['War Letters'],
    tags: ['ww2'],
    people: ['Samuel'],
    thumbnailColor: 'bg-emerald-200',
  },
];

const defaultQuery: SearchQuery = {
  text: '',
  startDate: '',
  endDate: '',
  location: '',
  mediaTypes: [],
  collections: [],
  tags: [],
  people: [],
};

const SearchPage = () => {
  const [query, setQuery] = useState<SearchQuery>(defaultQuery);
  const [results, setResults] = useState<MediaItem[]>(MOCK_MEDIA);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const availableFilters = useMemo(
    () => ({
      mediaTypes: [...new Set(MOCK_MEDIA.map((item) => item.type))],
      collections: [...new Set(MOCK_MEDIA.flatMap((item) => item.collections))],
      tags: [...new Set(MOCK_MEDIA.flatMap((item) => item.tags))],
      people: [...new Set(MOCK_MEDIA.flatMap((item) => item.people))],
    }),
    [],
  );

  const handleQueryChange = (changes: Partial<SearchQuery>) => {
    setQuery((prev) => ({ ...prev, ...changes }));
  };

  const performSearch = (nextQuery: SearchQuery) => {
    const nextResults = MOCK_MEDIA.filter((item) => {
      const matchesText = nextQuery.text
        ? item.title.toLowerCase().includes(nextQuery.text.toLowerCase())
        : true;

      const matchesStart = nextQuery.startDate ? item.date >= nextQuery.startDate : true;
      const matchesEnd = nextQuery.endDate ? item.date <= nextQuery.endDate : true;
      const matchesLocation = nextQuery.location
        ? item.location.toLowerCase().includes(nextQuery.location.toLowerCase())
        : true;

      const matchMulti = (selected: string[], haystack: string[]) =>
        selected.length === 0 || selected.every((value) => haystack.includes(value));

      const matchesMediaType =
        nextQuery.mediaTypes.length === 0 || nextQuery.mediaTypes.includes(item.type);

      return (
        matchesText &&
        matchesStart &&
        matchesEnd &&
        matchesLocation &&
        matchesMediaType &&
        matchMulti(nextQuery.collections, item.collections) &&
        matchMulti(nextQuery.tags, item.tags) &&
        matchMulti(nextQuery.people, item.people)
      );
    });

    setResults(nextResults);
  };

  const debouncedSearch = useDebouncedCallback(performSearch, 400);

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const handleSubmit = () => {
    performSearch(query);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SearchToolbar
        query={query}
        availableFilters={availableFilters}
        onQueryChange={handleQueryChange}
        onSubmit={handleSubmit}
        advancedOpen={advancedOpen}
        onToggleAdvanced={() => setAdvancedOpen((open) => !open)}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Search Media</h1>
              <p className="text-sm text-slate-500">
                Showing {results.length} curated item{results.length === 1 ? '' : 's'} from your archive.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-full border border-vault-blue/30 px-4 py-2 text-sm font-medium text-vault-blue transition hover:bg-vault-blue/10"
            >
              Refresh results
            </button>
          </div>

          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
              No media matches your current filters. Try broadening your search.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((item) => (
                <article
                  key={item.id}
                  className="flex gap-4 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm"
                >
                  <div className={`h-20 w-20 rounded-lg ${item.thumbnailColor}`}></div>
                  <div className="flex flex-1 flex-col gap-1">
                    <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-500">
                      {item.type.toUpperCase()} · {new Date(item.date).toLocaleDateString()} · {item.location}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {item.collections.map((collection) => (
                        <span
                          key={collection}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                        >
                          {collection}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default SearchPage;