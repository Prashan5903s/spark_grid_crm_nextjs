'use client';
import { useEffect, useState, useCallback } from 'react';

import { Viewer, Worker } from '@react-pdf-viewer/core';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { fullScreenPlugin } from '@react-pdf-viewer/full-screen';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/zoom/lib/styles/index.css';
import '@react-pdf-viewer/full-screen/lib/styles/index.css';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography
} from '@mui/material';

import DialogCloseButton from '@/components/dialogs/DialogCloseButton';

export default function PdfViewer({ pdfUrl, onPageChange, setFieldData, pageData }) {
  const zoomPluginInstance = zoomPlugin();
  const { ZoomInButton, ZoomOutButton } = zoomPluginInstance;

  const fullScreenPluginInstance = fullScreenPlugin();
  const { EnterFullScreenButton } = fullScreenPluginInstance;

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(null);
  const [viewedPages, setViewedPages] = useState([]);

  const [openDialog, setOpenDialog] = useState(false);

  // Restore saved state
  useEffect(() => {
    if (!pageData) return;

    let newCurrent = pageData.current_page_no || 1;
    let newViewed = Array.isArray(pageData.view_page_no)
      ? Array.from(new Set(pageData.view_page_no))
      : [];

    if (totalPages && newCurrent > totalPages) {
      newCurrent = totalPages;
    }

    setCurrentPage(newCurrent);
    setViewedPages(newViewed);
  }, [pageData, totalPages]);

  // Handle page change
  const handlePageChange = useCallback(
    (e) => {
      const newCurrentPage = e.currentPage + 1; // Viewer is 0-indexed
      const newTotal = e.doc.numPages;

      setCurrentPage(newCurrentPage);
      setTotalPages(newTotal);

      setViewedPages((prev) => {
        const s = new Set(prev);
        
        s.add(newCurrentPage);
        
        return Array.from(s).sort((a, b) => a - b);
      });

      onPageChange?.(newCurrentPage, newTotal);
    },
    [onPageChange]
  );

  // Sync parent state
  useEffect(() => setFieldData?.(prev => ({ ...prev, currentPage })), [currentPage]);
  useEffect(() => setFieldData?.(prev => ({ ...prev, totalPages })), [totalPages]);
  useEffect(() => setFieldData?.(prev => ({ ...prev, viewedPages })), [viewedPages]);

  const unreadPages = totalPages
    ? Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => !viewedPages.includes(p))
    : [];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '10px', padding: '8px', alignItems: 'center' }}>
        <ZoomOutButton>{({ onClick }) => <button onClick={onClick}>− Zoom Out</button>}</ZoomOutButton>
        <ZoomInButton>{({ onClick }) => <button onClick={onClick}>+ Zoom In</button>}</ZoomInButton>

        <IconButton color="primary" onClick={() => setOpenDialog(true)}>
          <i className='tabler-menu'></i>
        </IconButton>

        <EnterFullScreenButton />
      </div>

      {/* PDF Viewer */}
      <div style={{ flex: 1, width: '100%', overflowY: 'auto' }}>
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer
            fileUrl={pdfUrl}
            initialPage={currentPage - 1}
            plugins={[zoomPluginInstance, fullScreenPluginInstance]}
            onPageChange={handlePageChange}
            onDocumentLoad={(e) => setTotalPages(e.doc.numPages)}
          />
        </Worker>
      </div>

      {/* Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Page Information
          <DialogCloseButton onClick={() => setOpenDialog(false)}>
            <i className="tabler-x" />
          </DialogCloseButton>
        </DialogTitle>

        <DialogContent dividers>
          <Typography variant="h6" gutterBottom>
            Read Pages
          </Typography>
          <Typography mb={2}>
            {viewedPages.length ? viewedPages.join(', ') : 'No pages viewed yet'}
          </Typography>

          <Typography variant="h6" gutterBottom>
            Unread Pages
          </Typography>
          <Typography>
            {unreadPages.length ? unreadPages.join(', ') : 'All pages read 🎉'}
          </Typography>
        </DialogContent>
      </Dialog>
    </div>
  );
}
