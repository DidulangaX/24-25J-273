// src/components/modulePage/PDFReader/PDFReader.js
import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "./PDFReader.css";

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFReader = ({ url }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  function changePage(offset) {
    setPageNumber((prevPageNumber) => prevPageNumber + offset);
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  return (
    <div className="pdf-reader">
      <div className="pdf-controls">
        <button type="button" disabled={pageNumber <= 1} onClick={previousPage}>
          Previous
        </button>
        <span>
          Page {pageNumber || (numPages ? 1 : "--")} of {numPages || "--"}
        </span>
        <button
          type="button"
          disabled={pageNumber >= numPages}
          onClick={nextPage}
        >
          Next
        </button>
      </div>
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        className="pdf-document"
      >
        <Page pageNumber={pageNumber} />
      </Document>
    </div>
  );
};

export default PDFReader;
