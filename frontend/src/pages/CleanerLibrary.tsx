// src/pages/CleanerLibrary.tsx
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Input from '../components/ui/Input';
import RuleCard from '../components/ui/RuleCard';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog';
import { Eye, Trash } from 'lucide-react';

const mockRules = [
  { id: 1, name: 'Remove duplicates', description: 'Removes identical rows based on Email', type: 'predef', createdAt: new Date('2023-03-01') },
  { id: 2, name: 'Clean phone numbers', description: 'International format +212 for GSM', type: 'predef', createdAt: new Date('2023-03-02') },
  { id: 3, name: 'Standardize names', description: 'Convert names to uppercase', type: 'ia', createdAt: new Date('2023-04-01') },
  { id: 4, name: 'Clear empty columns', description: 'Remove columns without values', type: 'ia', createdAt: new Date('2023-04-01') },
];

export default function CleanerLibrary() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'predef' | 'ia'>('all');
  const [selectedRule, setSelectedRule] = useState<typeof mockRules[number] | null>(null);

  const filteredRules = mockRules.filter((rule) => {
    const matchesSearch = rule.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || rule.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 pl-16 bg-white dark:bg-zinc-900 min-h-screen text-zinc-900 dark:text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Cleansing Library</h1>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          type="text"
          placeholder="Search for a rule..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-1/2"
        />

        <select
          className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded px-3 py-2"
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'predef' | 'ia')}
        >
          <option value="all">All</option>
          <option value="predef">Predefined</option>
          <option value="ia">AI</option>
        </select>
      </div>

      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase border-b border-zinc-200 dark:border-zinc-700">
          <tr>
            <th className="px-4 py-2 text-zinc-500 dark:text-zinc-400">Title</th>
            <th className="px-4 py-2 text-zinc-500 dark:text-zinc-400">Description</th>
            <th className="px-4 py-2 text-zinc-500 dark:text-zinc-400">Category</th>
            <th className="px-4 py-2 text-zinc-500 dark:text-zinc-400">Added</th>
            <th className="px-4 py-2 text-right text-zinc-500 dark:text-zinc-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredRules.map((rule) => (
            <tr key={rule.id} className="border-b border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">
              <td className="px-4 py-2 font-semibold whitespace-nowrap">{rule.name}</td>
              <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">{rule.description}</td>
              <td className="px-4 py-2 whitespace-nowrap">
                <span className={`text-xs px-2 py-1 rounded font-medium ${rule.type === 'predef' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
                  {rule.type === 'predef' ? 'Predefined' : 'AI'}
                </span>
              </td>
              <td className="px-4 py-2 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                {formatDistanceToNow(rule.createdAt, { addSuffix: true })}
              </td>
              <td className="px-4 py-2 flex justify-end items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <button title="Preview" onClick={() => setSelectedRule(rule)}>
                      <Eye className="w-4 h-4 text-blue-600 hover:text-blue-500" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700">
                    {selectedRule && <RuleCard rule={selectedRule} />}
                  </DialogContent>
                </Dialog>

                {rule.type === 'ia' && (
                  <button title="Delete">
                    <Trash className="w-4 h-4 text-red-600 hover:text-red-500" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}