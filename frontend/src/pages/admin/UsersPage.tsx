import React, { useState } from 'react';
import UsersTable from '../../components/admin/UsersTable';

const UsersPage = () => {
  const [search, setSearch] = useState('');

  return (
    <div>
      <h1 className="text-3xl mb-6">Users</h1>
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search for a user..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-1/2 p-2 rounded border"
        />
      </div>
      <UsersTable search={search} />
    </div>
  );
};

export default UsersPage; 