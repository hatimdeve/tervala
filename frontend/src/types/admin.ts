export interface Organization {
    id: string;
    clerk_org_id: string;
    name: string;
    settings: Record<string, any>;
    quota_limit: number;
    quota_used: number;
    created_at: string;
    updated_at?: string;
}

export interface User {
    id: string;
    clerk_user_id: string;
    email: string;
    organization_id: string;
    is_admin: boolean;
    created_at: string;
    updated_at?: string;
}

export interface OrganizationStats {
    total_files_processed: number;
    files_processed_today: number;
    active_users: number;
    processing_success_rate: number;
}

export interface QuotaInfo {
    quota_used: number;
    quota_limit: number;
    quota_remaining: number;
    quota_percentage: number;
}

export interface ActivitySummary {
    date: string;
    total_files: number;
    successful_files: number;
    failed_files: number;
    success_rate: number;
} 