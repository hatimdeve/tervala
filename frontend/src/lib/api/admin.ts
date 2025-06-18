import axios from 'axios';
import { Organization, User, OrganizationStats, QuotaInfo, ActivitySummary } from '../../types/admin';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Créer une instance axios avec la configuration de base
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});

// Ajouter un intercepteur pour les requêtes
api.interceptors.request.use((config) => {
    const token = axios.defaults.headers.common['Authorization'];
    if (token && config.headers) {
        config.headers.Authorization = token;
    }
    return config;
});

export const adminApi = {
    // Organizations
    getOrganizations: async (): Promise<Organization[]> => {
        const { data } = await api.get<Organization[]>('/organizations');
        return data;
    },

    getOrganization: async (id: string): Promise<Organization> => {
        const { data } = await api.get<Organization>(`/organizations/${id}`);
        return data;
    },

    updateOrganization: async (id: string, data: Partial<Organization>): Promise<Organization> => {
        const { data: updatedOrg } = await api.put<Organization>(`/organizations/${id}`, data);
        return updatedOrg;
    },

    getOrganizationStats: async (id: string): Promise<OrganizationStats> => {
        const { data } = await api.get<OrganizationStats>(`/organizations/${id}/usage`);
        return data;
    },

    getOrganizationQuota: async (id: string): Promise<QuotaInfo> => {
        const { data } = await api.get<QuotaInfo>(`/organizations/${id}/quota`);
        return data;
    },

    resetOrganizationQuota: async (id: string): Promise<QuotaInfo> => {
        const { data } = await api.post<QuotaInfo>(`/organizations/${id}/quota/reset`);
        return data;
    },

    getOrganizationActivity: async (id: string, days: number = 30): Promise<ActivitySummary[]> => {
        const { data } = await api.get<ActivitySummary[]>(`/organizations/${id}/activity?days=${days}`);
        return data;
    },

    // Users
    getUsers: async (organizationId: string): Promise<User[]> => {
        const { data } = await api.get<User[]>(`/users/organization/${organizationId}`);
        return data;
    },

    getUser: async (id: string): Promise<User> => {
        const { data } = await api.get<User>(`/users/${id}`);
        return data;
    },

    updateUserRole: async (id: string, isAdmin: boolean): Promise<User> => {
        const { data } = await api.put<User>(`/users/${id}/role`, { is_admin: isAdmin });
        return data;
    },

    searchUsers: async (organizationId: string, search: string): Promise<User[]> => {
        const { data } = await api.get<User[]>(
            `/users/organization/${organizationId}/search?search=${encodeURIComponent(search)}`
        );
        return data;
    }
}; 