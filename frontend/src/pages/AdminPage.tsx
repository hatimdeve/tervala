import React from 'react';
import { AdminProvider } from '../contexts/AdminContext';
import { OrganizationList } from '../components/admin/OrganizationList';
import { UserList } from '../components/admin/UserList';

export const AdminPage: React.FC = () => {
    return (
        <AdminProvider>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Administration</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-lg shadow">
                        <OrganizationList />
                    </div>
                    <div className="bg-white rounded-lg shadow">
                        <UserList />
                    </div>
                </div>
            </div>
        </AdminProvider>
    );
}; 