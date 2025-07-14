'use client';

import { useState } from 'react';
import { IDEA_CATEGORIES, IdeaCategory, SortOption, type IdeaFilters } from '@/types/idea';
import { Listbox } from '@headlessui/react';

interface IdeaFiltersProps {
  filters: IdeaFilters;
  onFiltersChange: (filters: IdeaFilters) => void;
}

export default function IdeaFilters({ filters, onFiltersChange }: IdeaFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCategoryChange = (category: IdeaCategory | undefined) => {
    onFiltersChange({ ...filters, category });
  };

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search: search || undefined });
  };

  const handleSortChange = (sortBy: SortOption) => {
    onFiltersChange({ ...filters, sortBy });
  };

  const clearFilters = () => {
    onFiltersChange({ sortBy: 'newest' });
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'alphabetical', label: 'Alphabetical' },
    { value: 'most-liked', label: 'Most Liked' },
  ];

  // Helper to ensure correct type for Listbox value
  const categoryValue = (filters.category || '') as IdeaCategory | '';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search ideas by title, description, or tags..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-row flex-wrap gap-2 w-full">
        {/* Category Filter */}
        <div className="flex-1 min-w-0">
          <Listbox value={categoryValue} onChange={(value) => handleCategoryChange(value || undefined)}>
            <div className="relative">
              <Listbox.Button className="w-full min-w-0 bg-white border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm text-left text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between">
                <span className="truncate">
                  {filters.category
                    ? `${IDEA_CATEGORIES.find(cat => cat.value === filters.category)?.icon} ${IDEA_CATEGORIES.find(cat => cat.value === filters.category)?.label}`
                    : 'All Categories'}
                </span>
                <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Listbox.Button>
              <Listbox.Options className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                <Listbox.Option value="" className={({ active }) => `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}` }>
                  {({ selected }) => (
                    <>
                      <span className="block flex items-center gap-2">All Categories</span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                          ✓
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
                {IDEA_CATEGORIES.map((category) => (
                  <Listbox.Option key={category.value} value={category.value} className={({ active }) => `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}` }>
                    {({ selected }) => (
                      <>
                        <span className="block flex items-center gap-2">{category.icon} {category.label}</span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                            ✓
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        {/* Sort Options */}
        <div className="flex-1 min-w-0">
          <Listbox value={filters.sortBy} onChange={handleSortChange}>
            <div className="relative">
              <Listbox.Button className="w-full min-w-0 bg-white border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm text-left text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between">
                <span className="truncate">
                  {sortOptions.find(opt => opt.value === filters.sortBy)?.label}
                </span>
                <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Listbox.Button>
              <Listbox.Options className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {sortOptions.map((option) => (
                  <Listbox.Option key={option.value} value={option.value} className={({ active }) => `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}` }>
                    {({ selected }) => (
                      <>
                        <span className="block truncate">{option.label}</span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                            ✓
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        {/* Clear Filters */}
        {(filters.category || filters.search) && (
          <button
            onClick={clearFilters}
            className="text-base sm:text-sm text-gray-500 hover:text-gray-700 transition-colors px-2"
            style={{ flex: '0 0 auto' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {(filters.category || filters.search) && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {filters.category && (
              <span className="inline-flex items-center px-3 py-2 sm:py-1 bg-blue-100 text-blue-800 text-base sm:text-sm rounded-full">
                {IDEA_CATEGORIES.find(cat => cat.value === filters.category)?.icon} 
                {IDEA_CATEGORIES.find(cat => cat.value === filters.category)?.label}
                <button
                  onClick={() => handleCategoryChange(undefined)}
                  className="ml-2 text-blue-600 hover:text-blue-800 text-lg sm:text-base"
                >
                  ×
                </button>
              </span>
            )}
            {filters.search && (
              <span className="inline-flex items-center px-3 py-2 sm:py-1 bg-green-100 text-green-800 text-base sm:text-sm rounded-full">
                Search: "{filters.search}"
                <button
                  onClick={() => handleSearchChange('')}
                  className="ml-2 text-green-600 hover:text-green-800 text-lg sm:text-base"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 