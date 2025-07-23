// src/features/products/pages/TrashPage.jsx
import React from 'react';
import TrashModal from '../components/TrashModal';

const TrashPage = () => {
  return (
    <div style={{ padding: 24 }}>
      <TrashModal visible={true} />
    </div>
  );
};

export default TrashPage;
