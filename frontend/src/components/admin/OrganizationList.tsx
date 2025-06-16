import React, { useEffect } from 'react';
import { useAdmin } from '../../contexts/AdminContext';

export const OrganizationList: React.FC = () => {
    const { organizations, selectedOrganization, loading, error, loadOrganizations, selectOrganization } = useAdmin();

    useEffect(() => {
        loadOrganizations();
    }, [loadOrganizations]);

    if (loading) return <div className="p-4">Chargement...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Organisations</h2>
            <div className="space-y-4">
                {organizations.map(org => (
                    <div
                        key={org.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedOrganization?.id === org.id
                                ? 'bg-blue-50 border-blue-500'
                                : 'hover:bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => selectOrganization(org)}
                    >
                        <h3 className="font-semibold">{org.name}</h3>
                        <div className="mt-2 text-sm text-gray-600">
                            <div>Quota utilisé: {org.quota_used} / {org.quota_limit}</div>
                            <div>ID Clerk: {org.clerk_org_id}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}; 