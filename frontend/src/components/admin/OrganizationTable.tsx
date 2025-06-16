import React, { useEffect, useState } from 'react';
import OrganizationUsersDropdown from './OrganizationUsersDropdown';
import { useAuth } from '@clerk/clerk-react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface User {
  id: string;
  email: string;
  is_admin: boolean;
}

interface Organization {
  id: string;
  name: string;
  clerk_org_id: string;
  quota_limit: number;
  quota_used: number;
  created_at: string;
  updated_at: string;
}

const OrganizationTable = ({ search }: { search: string }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openOrgId, setOpenOrgId] = useState<string | null>(null);
  const [orgUsers, setOrgUsers] = useState<{ [orgId: string]: User[] }>({});
  const [loadingUsers, setLoadingUsers] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        const token = await getToken();
        const res = await fetch('http://localhost:8000/organizations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Erreur lors du chargement des organisations');
        const data = await res.json();
        setOrganizations(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getToken]);

  const handleToggleOrg = async (orgId: string) => {
    if (openOrgId === orgId) {
      setOpenOrgId(null);
      return;
    }
    setOpenOrgId(orgId);
    if (!orgUsers[orgId]) {
      setLoadingUsers(orgId);
      try {
        const token = await getToken();
        const res = await fetch(`http://localhost:8000/users/organization/${orgId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Erreur lors du chargement des utilisateurs');
        const data = await res.json();
        setOrgUsers(prev => ({ ...prev, [orgId]: data }));
      } catch (err) {
        setOrgUsers(prev => ({ ...prev, [orgId]: [] }));
      } finally {
        setLoadingUsers(null);
      }
    }
  };

  const filtered = organizations.filter(org =>
    org.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="text-red-500 font-bold">{error}</div>;

  return (
    <table className="w-full mt-2">
      <thead>
        <tr className="text-left text-xs text-gray-500 font-bold font-russo">
          <th className="py-2 w-8"></th>
          <th className="py-2">NAME</th>
          <th className="py-2">CLERK ORG ID</th>
          <th className="py-2">QUOTA LIMIT</th>
          <th className="py-2">QUOTA USED</th>
          <th className="py-2">CREATED AT</th>
          <th className="py-2">UPDATED AT</th>
          <th className="py-2">ACTIONS</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map(org => (
          <React.Fragment key={org.id}>
            <tr className="border-b hover:bg-gray-50 dark:hover:bg-zinc-700">
              <td className="py-2 text-center cursor-pointer" onClick={() => handleToggleOrg(org.id)}>
                {openOrgId === org.id ? (
                  <ChevronDown className="inline w-5 h-5 text-blue-500 transition-transform duration-200" />
                ) : (
                  <ChevronRight className="inline w-5 h-5 text-blue-500 transition-transform duration-200" />
                )}
              </td>
              <td className="py-2 font-bold">{org.name}</td>
              <td className="py-2 text-xs">{org.clerk_org_id}</td>
              <td className="py-2">{org.quota_limit}</td>
              <td className="py-2">{org.quota_used}</td>
              <td className="py-2 text-xs">{org.created_at}</td>
              <td className="py-2 text-xs">{org.updated_at}</td>
              <td className="py-2">
                <button className="text-blue-500 hover:underline">👁️</button>
              </td>
            </tr>
            {openOrgId === org.id && (
              <tr>
                <td colSpan={8} className="bg-gray-50 dark:bg-zinc-800">
                  {loadingUsers === org.id ? (
                    <div>Chargement des utilisateurs...</div>
                  ) : (
                    <OrganizationUsersDropdown users={orgUsers[org.id] || []} />
                  )}
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
};

export default OrganizationTable; 