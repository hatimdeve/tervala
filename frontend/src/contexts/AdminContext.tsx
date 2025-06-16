import React, { createContext, useContext, useState, useCallback } from 'react';
import { Organization, User } from '../types/admin';
import { adminApi } from '../lib/api/admin';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

interface AdminContextType {
    organizations: Organization[];
    selectedOrganization: Organization | null;
    users: User[];
    loading: boolean;
    error: string | null;
    loadOrganizations: () => Promise<void>;
    loadUsers: (organizationId: string) => Promise<void>;
    selectOrganization: (org: Organization) => void;
    updateOrganizationQuota: (orgId: string, newQuota: number) => Promise<void>;
    updateUserRole: (userId: string, isAdmin: boolean) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { getToken } = useAuth();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const makeAuthenticatedRequest = useCallback(async <T,>(request: () => Promise<T>): Promise<T> => {
        try {
            const token = await getToken();
            if (!token) {
                throw new Error("Pas de token d'authentification disponible");
            }
            
            // Définir le token dans les en-têtes par défaut d'Axios
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Faire la requête
            return await request();
        } catch (err) {
            console.error('Erreur lors de la requête authentifiée:', err);
            throw err;
        }
    }, [getToken]);

    const loadOrganizations = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const orgs = await makeAuthenticatedRequest(() => adminApi.getOrganizations());
            setOrganizations(orgs);
        } catch (err) {
            setError('Erreur lors du chargement des organisations');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [makeAuthenticatedRequest]);

    const loadUsers = useCallback(async (organizationId: string) => {
        try {
            setLoading(true);
            setError(null);
            const fetchedUsers = await makeAuthenticatedRequest(() => adminApi.getUsers(organizationId));
            setUsers(fetchedUsers);
        } catch (err) {
            setError('Erreur lors du chargement des utilisateurs');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [makeAuthenticatedRequest]);

    const selectOrganization = useCallback((org: Organization) => {
        setSelectedOrganization(org);
        loadUsers(org.id);
    }, [loadUsers]);

    const updateOrganizationQuota = useCallback(async (orgId: string, newQuota: number) => {
        try {
            setLoading(true);
            setError(null);
            const updatedOrg = await makeAuthenticatedRequest(() => 
                adminApi.updateOrganization(orgId, { quota_limit: newQuota })
            );
            setOrganizations(orgs => orgs.map(org => 
                org.id === updatedOrg.id ? updatedOrg : org
            ));
            if (selectedOrganization?.id === updatedOrg.id) {
                setSelectedOrganization(updatedOrg);
            }
        } catch (err) {
            setError('Erreur lors de la mise à jour du quota');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [selectedOrganization, makeAuthenticatedRequest]);

    const updateUserRole = useCallback(async (userId: string, isAdmin: boolean) => {
        try {
            setLoading(true);
            setError(null);
            const updatedUser = await makeAuthenticatedRequest(() => 
                adminApi.updateUserRole(userId, isAdmin)
            );
            setUsers(users => users.map(user => 
                user.id === updatedUser.id ? updatedUser : user
            ));
        } catch (err) {
            setError('Erreur lors de la mise à jour du rôle');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [makeAuthenticatedRequest]);

    const value = {
        organizations,
        selectedOrganization,
        users,
        loading,
        error,
        loadOrganizations,
        loadUsers,
        selectOrganization,
        updateOrganizationQuota,
        updateUserRole,
    };

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
}; 