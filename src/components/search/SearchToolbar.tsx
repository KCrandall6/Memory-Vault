import { ChangeEvent } from 'react';

export interface SearchQuery {
  text: string;
  startDate: string;
  endDate: string;
  location: string;
  mediaTypes: string[];
  collections: string[];
  tags: string[];
  people: string[];
}

export interface AvailableFilters {
  mediaTypes: string[];
  collections: string[];
  tags: string[];
  people: string[];
}

interface SearchToolbarProps {
  query: SearchQuery;
  availableFilters: AvailableFilters;
  onQueryChange: (changes: Partial<SearchQuery>) => void;
  onSubmit: () => void;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
}

const sectionLabel = 'text-sm font-medium text-slate-600';
const textInput =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-vault-blue focus:outline-none focus:ring-1 focus:ring-vault-blue';
const selectInput = `${textInput} h-28`;

const SearchToolbar = ({
  query,
  availableFilters,
  onQueryChange,
  onSubmit,
  advancedOpen,
  onToggleAdvanced,
}: SearchToolbarProps) => {
  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    key: keyof SearchQuery,
  ) => {
    if (event.target instanceof HTMLSelectElement && event.target.multiple) {
      const values = Array.from(event.target.selectedOptions).map((option) => option.value);
      onQueryChange({ [key]: values } as Partial<SearchQuery>);
    } else {
      onQueryChange({ [key]: event.target.value } as Partial<SearchQuery>);
    }
  };

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <label className="flex-1">
            <span className={sectionLabel}>Search keywords</span>
            <input
              type="text"
              value={query.text}
              onChange={(event) => handleChange(event, 'text')}
              placeholder="Try “wedding 1978”"
              className={textInput}
            />
          </label>
          <label className="flex flex-1 flex-col">
            <span className={sectionLabel}>Start date</span>
            <input
              type="date"
              value={query.startDate}
              onChange={(event) => handleChange(event, 'startDate')}
              className={textInput}
            />
          </label>
          <label className="flex flex-1 flex-col">
            <span className={sectionLabel}>End date</span>
            <input
              type="date"
              value={query.endDate}
              onChange={(event) => handleChange(event, 'endDate')}
              className={textInput}
            />
          </label>
          <label className="flex flex-1 flex-col">
            <span className={sectionLabel}>Location</span>
            <input
              type="text"
              value={query.location}
              onChange={(event) => handleChange(event, 'location')}
              placeholder="City, State"
              className={textInput}
            />
          </label>
          <div className="flex flex-col gap-2 lg:w-48">
            <button
              type="submit"
              className="w-full rounded-xl bg-vault-blue px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-800"
            >
              Search
            </button>
            <button
              type="button"
              aria-expanded={advancedOpen}
              aria-controls="advanced-search-filters"
              onClick={onToggleAdvanced}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              {advancedOpen ? 'Hide advanced' : 'Show advanced'}
            </button>
          </div>
        </div>

        <div
          id="advanced-search-filters"
          className={`overflow-hidden rounded-2xl border border-slate-200 bg-white/80 transition-[max-height,opacity] duration-300 ${
            advancedOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col">
              <span className={sectionLabel}>Media types</span>
              <select
                multiple
                value={query.mediaTypes}
                onChange={(event) => handleChange(event, 'mediaTypes')}
                className={selectInput}
              >
                {availableFilters.mediaTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col">
              <span className={sectionLabel}>Collections</span>
              <select
                multiple
                value={query.collections}
                onChange={(event) => handleChange(event, 'collections')}
                className={selectInput}
              >
                {availableFilters.collections.map((collection) => (
                  <option key={collection} value={collection}>
                    {collection}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col">
              <span className={sectionLabel}>Tags</span>
              <select
                multiple
                value={query.tags}
                onChange={(event) => handleChange(event, 'tags')}
                className={selectInput}
              >
                {availableFilters.tags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col">
              <span className={sectionLabel}>People</span>
              <select
                multiple
                value={query.people}
                onChange={(event) => handleChange(event, 'people')}
                className={selectInput}
              >
                {availableFilters.people.map((person) => (
                  <option key={person} value={person}>
                    {person}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </form>
    </header>
  );
};

export default SearchToolbar;