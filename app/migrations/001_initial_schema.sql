-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_org_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Organization status for quota management
CREATE TABLE organization_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    quota_status JSONB DEFAULT '{}',
    is_blocked BOOLEAN DEFAULT false,
    last_checked TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_organization 
        FOREIGN KEY(organization_id) 
        REFERENCES organizations(id)
        ON DELETE CASCADE
);

-- Cleansing rules
CREATE TABLE cleansing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL,
    configuration JSONB NOT NULL,
    is_template BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    created_by VARCHAR(255) NOT NULL, -- clerk_user_id
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_organization 
        FOREIGN KEY(organization_id) 
        REFERENCES organizations(id)
        ON DELETE CASCADE
);

-- Token usage tracking
CREATE TABLE token_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_tokens_used INTEGER DEFAULT 0,
    usage_details JSONB DEFAULT '{}',
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_organization 
        FOREIGN KEY(organization_id) 
        REFERENCES organizations(id)
        ON DELETE CASCADE
);

-- Usage events for detailed tracking
CREATE TABLE token_usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL, -- clerk_user_id
    rule_id UUID REFERENCES cleansing_rules(id),
    tokens_used INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_organization 
        FOREIGN KEY(organization_id) 
        REFERENCES organizations(id)
        ON DELETE CASCADE
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_modtime
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cleansing_rules_modtime
    BEFORE UPDATE ON cleansing_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 