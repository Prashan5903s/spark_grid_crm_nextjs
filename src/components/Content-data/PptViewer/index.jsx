'use client';

import React from 'react';

export default function PptIframeViewer({ fileUrl, onPageLoad }) {
  // onPageLoad won't work reliably with iframe because we can't detect user scrolling inside iframe for remote PPTX

  if (!fileUrl) return null;

  // Use Microsoft Office Online Viewer
  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;

  return (
    <div style={{ height: '80vh', width: '100%' }}>
      <iframe
        src={officeViewerUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        allowFullScreen
      />
    </div>
  );
}
