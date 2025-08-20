import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CuradoriaLayout } from '@/components/curadoria/CuradoriaLayout';
import { CuradoriaApproval } from '@/components/curadoria/CuradoriaApproval';
import { NewsletterExport } from '@/components/curadoria/NewsletterExport';
import { CuradoriaEditor } from '@/components/curadoria/CuradoriaEditor';
import { CuradoriaPersona } from '@/components/curadoria/CuradoriaPersona';
import { KeywordsConfig } from '@/components/config/KeywordsConfig';

const Curadoria = () => {
  return (
    <CuradoriaLayout>
      <Routes>
        <Route path="" element={<Navigate to="/curadoria/approval" replace />} />
        <Route path="approval" element={<CuradoriaApproval />} />
        <Route path="newsletter" element={<NewsletterExport />} />
        <Route path="editor" element={<CuradoriaEditor />} />
        <Route path="categorias" element={<KeywordsConfig />} />
        <Route path="persona" element={<CuradoriaPersona />} />
      </Routes>
    </CuradoriaLayout>
  );
};

export default Curadoria;