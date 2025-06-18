import React, { useState } from 'react';
import OrganizationTable from '../../components/admin/OrganizationTable';

const OrganizationsPage = () => {
  const [search, setSearch] = useState('');

  return (
    <div>
      <h2 className="text-3xl mb-6">Organizations</h2>
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search for an organization..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-1/2 p-2 rounded border"
        />
      </div>
      <OrganizationTable search={search} />
    </div>
  );
};

export default OrganizationsPage; 