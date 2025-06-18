import React from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { Switch } from '@headlessui/react';

export const UserList: React.FC = () => {
    const { selectedOrganization, users, loading, error, updateUserRole } = useAdmin();

    if (!selectedOrganization) {
        return <div className="p-4">Sélectionnez une organisation pour voir ses utilisateurs</div>;
    }

    if (loading) return <div className="p-4">Chargement...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Utilisateurs de {selectedOrganization.name}</h2>
            <div className="space-y-4">
                {users.map(user => (
                    <div key={user.id} className="p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">{user.email}</h3>
                                <div className="text-sm text-gray-600">
                                    <div>ID: {user.id}</div>
                                    <div>ID Clerk: {user.clerk_user_id}</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm">Admin</span>
                                <Switch
                                    checked={user.is_admin}
                                    onChange={(checked: boolean) => updateUserRole(user.id, checked)}
                                    className={`${
                                        user.is_admin ? 'bg-blue-600' : 'bg-gray-200'
                                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                                >
                                    <span
                                        className={`${
                                            user.is_admin ? 'translate-x-6' : 'translate-x-1'
                                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                    />
                                </Switch>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}; 