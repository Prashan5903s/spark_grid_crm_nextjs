"use client";

import { useEffect, useRef, useState } from "react";

import { renderAsync } from "docx-preview";

// MUI
import { Dialog } from "@mui/material";

import IconButton from "@mui/material/IconButton";

import DialogCloseButton from "@/components/dialogs/DialogCloseButton";

export default function DocViewer({
  fileUrl,
  onPageLoad,
  setFieldData,
  pageData,
}) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const wrapperRef = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [openStatusModal, setOpenStatusModal] = useState(false);

  const [viewedPages, setViewedPages] = useState(() => {
    const pages = Array.isArray(pageData?.view_page_no)
      ? pageData.view_page_no.map(Number)
      : [];

    if (!pages.includes(1)) pages.unshift(1);

    return pages;
  });

  const unreadPages = totalPages
    ? Array.from({ length: totalPages }, (_, i) => i + 1).filter(
      (p) => !viewedPages.includes(p)
    )
    : [];

  const allowScrollEvents = useRef(false);
  const ZOOM_PAGE_HEIGHT = 1100;
  const restoreToPage = Number(pageData?.current_page_no) || 1;

  const zoomIn = () => setZoom((z) => Math.min(z + 0.1, 3));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.3));

  // ─────────────────────────────────────────────
  // FULL SCREEN
  // ─────────────────────────────────────────────
  const enterFullscreen = () => {
    const elem = wrapperRef.current;

    if (elem.requestFullscreen) elem.requestFullscreen();
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFsChange);

    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);

  }, []);

  // ─────────────────────────────────────────────
  // DOCUMENT RENDER
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!fileUrl || !containerRef.current || !contentRef.current) return;

    const container = containerRef.current;
    const content = contentRef.current;

    let scrollHandler = null;
    let resizeObserver = null;

    allowScrollEvents.current = false;

    fetch(fileUrl)
      .then((res) => res.arrayBuffer())
      .then((buffer) => renderAsync(buffer, content))
      .then(() => {
        resizeObserver = new ResizeObserver(() => {
          const docHeight = content.scrollHeight;
          const pages = Math.max(1, Math.round(docHeight / ZOOM_PAGE_HEIGHT));

          setTotalPages(pages);

          const scrollPage = Math.min(Math.max(restoreToPage, 1), pages);

          container.scrollTop = (scrollPage - 1) * (docHeight / pages);

          setCurrentPage(scrollPage);

          setViewedPages((prev) => {
            const arr = [...new Set(prev)];

            if (!arr.includes(scrollPage)) arr.push(scrollPage);

            if (!arr.includes(1)) arr.unshift(1);

            return arr;
          });

          setTimeout(() => {
            allowScrollEvents.current = true;
          }, 300);

          onPageLoad?.(scrollPage, pages);
        });

        resizeObserver.observe(content);

        scrollHandler = () => {
          if (!allowScrollEvents.current) return;

          const docHeight = content.scrollHeight;
          const pages = Math.max(1, Math.round(docHeight / ZOOM_PAGE_HEIGHT));
          const pageHeight = docHeight / pages;

          let newPage;

          if (container.scrollTop <= 2) newPage = 1;
          else if (
            container.scrollTop + container.clientHeight >=
            docHeight - 2
          ) {
            newPage = pages;
          } else {
            newPage = Math.min(
              pages,
              Math.max(
                1,
                Math.floor(container.scrollTop / pageHeight) + 1
              )
            );
          }

          if (newPage !== currentPage) {
            setCurrentPage(newPage);

            setViewedPages((prev) => {
              const arr = [...new Set(prev)];

              if (!arr.includes(newPage)) arr.push(newPage);

              if (!arr.includes(1)) arr.unshift(1);

              return arr;
            });

            onPageLoad?.(newPage, pages);
          }
        };

        container.addEventListener("scroll", scrollHandler);
      });

    return () => {
      if (scrollHandler) container.removeEventListener("scroll", scrollHandler);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [fileUrl]);

  // SYNC
  useEffect(() => {
    setFieldData?.((prev) => ({ ...prev, currentPage }));
  }, [currentPage]);

  useEffect(() => {
    setFieldData?.((prev) => ({ ...prev, totalPages }));
  }, [totalPages]);

  useEffect(() => {
    setFieldData?.((prev) => ({ ...prev, viewedPages }));
  }, [viewedPages]);

  // ─────────────────────────────────────────────
  // RETURN VIEW
  // ─────────────────────────────────────────────

  return (
    <div
      ref={wrapperRef}
      style={{
        height: "100%",
        width: "100%",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* TOP TOOLBAR */}
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: 10,
          background: "#f0f0f0",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <button onClick={zoomOut}>-</button>
        <button onClick={zoomIn}>+</button>

        {!isFullscreen && <button onClick={enterFullscreen}>Full Screen</button>}
        {isFullscreen && <button onClick={exitFullscreen}>Exit Full Screen</button>}

        {/* PAGE STATUS MODAL ICON BUTTON */}
        <IconButton
          onClick={() => setOpenStatusModal(true)}
          size="small"
          style={{
            marginLeft: "auto",
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        >
          <i className="tabler-menu"></i> {}
        </IconButton>
      </div>

      {/* DOC VIEW AREA */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 10,
          background: "#ffffff",
        }}
      >
        <div
          ref={contentRef}
          style={{
            zoom,
            transformOrigin: "top left",
          }}
        />
      </div>

      {/* ───────────────────────────────────────────── */}
      {/* PAGE STATUS MODAL */}
      {/* ───────────────────────────────────────────── */}
      <Dialog
        open={openStatusModal}
        onClose={() => setOpenStatusModal(false)}
        maxWidth="sm"
        fullWidth
        sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      >
        <div style={{ padding: 20, position: "relative" }}>

          <DialogCloseButton onClick={() => {
            setOpenStatusModal(false)
            setSelected()
          }} disableRipple>
            <i className="tabler-x" />
          </DialogCloseButton>

          <h2 style={{ marginBottom: 20 }}>Page Status</h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {/* READ PAGES */}
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: "#e9f7ef",
                border: "1px solid #c8e6c9",
              }}
            >
              <h4>Read Pages</h4>
              <p>
                {viewedPages.length > 0 ? viewedPages.join(", ") : "None yet"}
              </p>
            </div>

            {/* UNREAD PAGES */}
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: "#fdecea",
                border: "1px solid #ffcdd2",
              }}
            >
              <h4>Unread Pages</h4>
              <p>
                {unreadPages.length > 0
                  ? unreadPages.join(", ")
                  : "All pages read 🎉"}
              </p>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
