-- Insert permission templates for common workflows

-- Google Ads Campaign Setup
insert into public.permission_templates (name, description, workflow_type, permissions, auto_apply, trigger_conditions, is_public) values
('Google Ads Campaign Setup', 'Permissions needed for setting up and managing Google Ads campaigns', 'google_ads_setup',
 '{"file_read": "low", "file_write": "low", "api_call": "medium", "bash_execute": "high"}'::jsonb,
 true,
 '{"detected_platforms": ["google_ads"], "min_confidence": "medium"}'::jsonb,
 true
),

-- Meta Ads Reporting
('Meta Ads Reporting', 'Permissions for reading and analyzing Meta Ads performance data', 'meta_ads_reporting',
 '{"file_read": "low", "api_call": "medium", "database_query": "low"}'::jsonb,
 true,
 '{"detected_platforms": ["meta_ads"], "operation_type": "reporting"}'::jsonb,
 true
),

-- Cross-platform Analytics
('Cross-platform Analytics', 'Permissions for aggregating data across multiple advertising platforms', 'cross_platform_analytics',
 '{"file_read": "low", "file_write": "medium", "api_call": "medium", "database_query": "medium"}'::jsonb,
 false,
 '{"detected_platforms": ["google_ads", "meta_ads"], "operation_type": "analytics"}'::jsonb,
 true
),

-- Campaign Optimization
('Campaign Optimization', 'Permissions for automated bidding and campaign optimization', 'campaign_optimization',
 '{"file_read": "low", "api_call": "high", "database_query": "medium", "bash_execute": "medium"}'::jsonb,
 false,
 '{"operation_type": "optimization", "automation_level": "high"}'::jsonb,
 true
),

-- Creative Management
('Creative Management', 'Permissions for managing ad creatives across platforms', 'creative_management',
 '{"file_read": "medium", "file_write": "medium", "api_call": "medium"}'::jsonb,
 true,
 '{"operation_type": "creative_management"}'::jsonb,
 true
),

-- Bulk Operations
('Bulk Operations', 'Permissions for bulk campaign operations and data imports', 'bulk_operations',
 '{"file_read": "high", "file_write": "high", "api_call": "high", "database_query": "high"}'::jsonb,
 false,
 '{"operation_type": "bulk", "batch_size": {"min": 100}}'::jsonb,
 true
);
