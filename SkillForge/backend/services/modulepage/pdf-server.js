const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors()); // Enable CORS for all routes

// Serve everything from the root directory and subdirectories
app.use('/files', express.static(__dirname));

// Create a route that will find and serve PDFs regardless of their location
app.get('/pdf/:filename', (req, res) => {
  const { filename } = req.params;
  console.log(`Looking for PDF: ${filename}`);
  
  // Try multiple locations
  const possibleLocations = [
    path.join(__dirname, 'uploads', 'pdfs', filename),
    path.join(__dirname, 'uploads', filename),
    path.join(__dirname, filename)
  ];
  
  // Try recursive search if not found in common locations
  function findFile(startDir, targetFile) {
    if (!fs.existsSync(startDir)) return null;
    
    const files = fs.readdirSync(startDir);
    for (const file of files) {
      const filePath = path.join(startDir, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          const found = findFile(filePath, targetFile);
          if (found) return found;
        } else if (file === targetFile) {
          return filePath;
        }
      } catch (err) {
        // Skip files/dirs we can't access
      }
    }
    return null;
  }
  
  // Check common locations first
  for (const location of possibleLocations) {
    console.log(`Checking: ${location}`);
    if (fs.existsSync(location)) {
      console.log(`Found at: ${location}`);
      return res.sendFile(location);
    }
  }
  
  // If not found, do a recursive search
  console.log("Not found in common locations, searching recursively...");
  const foundPath = findFile(__dirname, filename);
  if (foundPath) {
    console.log(`Found at: ${foundPath}`);
    return res.sendFile(foundPath);
  }
  
  // Not found anywhere
  console.log("PDF not found anywhere");
  res.status(404).send('PDF not found');
});

// Create a route to list all PDFs we can find
app.get('/list-pdfs', (req, res) => {
  // Find PDFs recursively
  function findPdfFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    
    const results = [];
    try {
      const list = fs.readdirSync(dir);
      
      list.forEach(file => {
        const filePath = path.join(dir, file);
        try {
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            // Recursively search directories
            results.push(...findPdfFiles(filePath));
          } else if (file.endsWith('.pdf')) {
            // Found a PDF
            results.push({
              name: file,
              path: filePath,
              size: stat.size,
              modified: stat.mtime
            });
          }
        } catch (err) {
          // Skip files we can't access
        }
      });
    } catch (err) {
      console.error(`Error reading directory ${dir}:`, err);
    }
    
    return results;
  }
  
  const pdfs = findPdfFiles(__dirname);
  res.json({
    count: pdfs.length,
    pdfs: pdfs
  });
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`PDF server running on http://localhost:${PORT}`);
  console.log(`- Browse PDFs at: http://localhost:${PORT}/list-pdfs`);
  console.log(`- Access a PDF at: http://localhost:${PORT}/pdf/filename.pdf`);
});