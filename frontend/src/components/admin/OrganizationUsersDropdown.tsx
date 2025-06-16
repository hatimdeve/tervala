import React from 'react';

const OrganizationUsersDropdown = ({ users }: { users: any[] }) => {
  return (
    <div className="org-users-dropdown">
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.email}</li>
        ))}
      </ul>
    </div>
  );
};

export default OrganizationUsersDropdown; 