'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface FileFilterProps {
  files: string[];
  onFilterChange: (filtered: string[]) => void;
}

export function FileFilter({ files, onFilterChange }: FileFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());

  const getFileType = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || 'unknown';
    return ext;
  };

  const fileTypes = Array.from(new Set(files.map((f) => getFileType(f))));

  const toggleType = (type: string) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedTypes(newSet);

    // Filter files
    let filtered = files;
    if (searchTerm) {
      filtered = filtered.filter((f) => f.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (newSet.size > 0) {
      filtered = filtered.filter((f) => newSet.has(getFileType(f)));
    }
    onFilterChange(filtered);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Filter files
    let filtered = files;
    if (value) {
      filtered = filtered.filter((f) => f.toLowerCase().includes(value.toLowerCase()));
    }
    if (selectedTypes.size > 0) {
      filtered = filtered.filter((f) => selectedTypes.has(getFileType(f)));
    }
    onFilterChange(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTypes(new Set());
    onFilterChange(files);
  };

  return (
    <div className="space-y-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Search Files</label>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="e.g., components/Auth..."
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
        />
      </div>

      {fileTypes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">File Types</label>
          <div className="flex flex-wrap gap-2">
            {fileTypes.map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedTypes.has(type)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                .{type}
              </button>
            ))}
          </div>
        </div>
      )}

      {(searchTerm || selectedTypes.size > 0) && (
        <button
          onClick={clearFilters}
          className="w-full px-3 py-2 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors"
        >
          <X size={16} />
          Clear Filters
        </button>
      )}
    </div>
  );
}
