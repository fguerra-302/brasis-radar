import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigLayout } from '@/components/config/ConfigLayout';
import { SourcesConfig } from '@/components/config/SourcesConfig';
import { SourcesStatus } from '@/components/sources/SourcesStatus';
import { KeywordsConfig } from '@/components/config/KeywordsConfig';
import { EditoriaWeights } from '@/components/config/EditoriaWeights';
import { ExternalApiConfig } from '@/components/config/ExternalApiConfig';
import { AutomationConfig } from '@/components/config/AutomationConfig';
import { BrandingConfig } from '@/components/config/BrandingConfig';
import { AINewsletterConfig } from '@/components/config/AINewsletterConfig';


const Config = () => {
  return (
    <ConfigLayout>
      <Routes>
        <Route path="" element={<Navigate to="/config/status" replace />} />
        <Route path="status" element={<SourcesStatus />} />
        <Route path="sources" element={<SourcesConfig />} />
        <Route path="keywords" element={<KeywordsConfig />} />
        <Route path="weights" element={<EditoriaWeights />} />
        <Route path="external-api" element={<ExternalApiConfig />} />
        <Route path="automation" element={<AutomationConfig />} />
        <Route path="branding" element={<BrandingConfig />} />
        <Route path="ai-newsletter" element={<AINewsletterConfig />} />
      </Routes>
    </ConfigLayout>
  );
};

export default Config;