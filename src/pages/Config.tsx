import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigLayout } from '@/components/config/ConfigLayout';
import { SourcesConfig } from '@/components/config/SourcesConfig';
import { KeywordsConfig } from '@/components/config/KeywordsConfig';
import { EditoriaWeights } from '@/components/config/EditoriaWeights';
import { APIsConfig } from '@/components/config/APIsConfig';


const AutomationConfig = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-slate-800">Automação</h1>
    <p className="text-slate-600">Configure execução automática (Em desenvolvimento)</p>
  </div>
);

const Config = () => {
  return (
    <ConfigLayout>
      <Routes>
        <Route path="" element={<Navigate to="/config/sources" replace />} />
        <Route path="sources" element={<SourcesConfig />} />
        <Route path="keywords" element={<KeywordsConfig />} />
        <Route path="weights" element={<EditoriaWeights />} />
        <Route path="apis" element={<APIsConfig />} />
        <Route path="automation" element={<AutomationConfig />} />
      </Routes>
    </ConfigLayout>
  );
};

export default Config;