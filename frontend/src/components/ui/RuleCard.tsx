import React from 'react';

type Rule = {
  id: number;
  name: string;
  description: string;
  type: string;
};

const RuleCard: React.FC<{ rule: Rule }> = ({ rule }) => {
  return (
    <div className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg p-4 shadow hover:shadow-lg transition cursor-pointer">
      <h3 className="text-lg font-semibold mb-1">{rule.name}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{rule.description}</p>
      <span className="mt-2 inline-block text-xs px-2 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded">{rule.type}</span>
    </div>
  );
};

export default RuleCard;