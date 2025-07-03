import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CuradoriaLayout } from '@/components/curadoria/CuradoriaLayout';
import { CuradoriaReview } from '@/components/curadoria/CuradoriaReview';
import { CuradoriaApproval } from '@/components/curadoria/CuradoriaApproval';
import { CuradoriaEditor } from '@/components/curadoria/CuradoriaEditor';

const Curadoria = () => {
  return (
    <CuradoriaLayout>
      <Routes>
        <Route path="" element={<Navigate to="/curadoria/review" replace />} />
        <Route path="review" element={<CuradoriaReview />} />
        <Route path="approval" element={<CuradoriaApproval />} />
        <Route path="editor" element={<CuradoriaEditor />} />
      </Routes>
    </CuradoriaLayout>
  );
};

export default Curadoria;