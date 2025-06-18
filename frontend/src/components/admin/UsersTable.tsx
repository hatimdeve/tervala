import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

interface User {
  id: string;
  clerk_user_id: string;
  email: string;
  organization_id: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

const UsersTable = ({ search }: { search: string }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        const token = await getToken();
        const res = await fetch('http://localhost:8000/users/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Erreur lors du chargement des utilisateurs');
        const data = await res.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getToken]);

  const filtered = users.filter(user =>
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="text-red-500 font-bold">{error}</div>;

  return (
    <table className="w-full mt-2">
      <thead>
        <tr className="text-left text-xs text-gray-500 font-bold font-russo">
          <th className="py-2">EMAIL</th>
          <th className="py-2">CLERK USER ID</th>
          <th className="py-2">ORGANIZATION ID</th>
          <th className="py-2">ADMIN</th>
          <th className="py-2">CREATED AT</th>
          <th className="py-2">UPDATED AT</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map(user => (
          <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-zinc-700">
            <td className="py-2 font-bold">{user.email}</td>
            <td className="py-2 text-xs">{user.clerk_user_id}</td>
            <td className="py-2 text-xs">{user.organization_id}</td>
            <td className="py-2">{user.is_admin ? '✔️' : ''}</td>
            <td className="py-2 text-xs">{user.created_at}</td>
            <td className="py-2 text-xs">{user.updated_at}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UsersTable; 