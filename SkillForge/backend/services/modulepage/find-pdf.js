const fs = require("fs");
const path = require("path");

// Define the current directory
const currentDir = __dirname;
console.log("Current directory:", currentDir);

// List all PDF files in uploads/pdfs
const pdfsPath = path.join(currentDir, "uploads", "pdfs");
console.log(`\nChecking: ${pdfsPath}`);
if (fs.existsSync(pdfsPath)) {
  console.log("Directory exists");
  const files = fs.readdirSync(pdfsPath);
  console.log("Files:", files);
} else {
  console.log("Directory does not exist");
}

// List all PDF files in uploads
const uploadsPath = path.join(currentDir, "uploads");
console.log(`\nChecking: ${uploadsPath}`);
if (fs.existsSync(uploadsPath)) {
  console.log("Directory exists");
  const files = fs.readdirSync(uploadsPath);
  console.log("Files:", files);
} else {
  console.log("Directory does not exist");
}

// Search for PDF files recursively in the current directory
console.log("\nSearching for PDFs recursively...");
function findPdfFiles(dir) {
  const results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively search directories
      try {
        results.push(...findPdfFiles(filePath));
      } catch (err) {
        // Skip directories we can't access
      }
    } else if (file.endsWith(".pdf")) {
      // Found a PDF
      results.push(filePath);
    }
  });

  return results;
}

try {
  const pdfs = findPdfFiles(currentDir);
  console.log(`Found ${pdfs.length} PDFs:`);
  pdfs.forEach((pdf) => console.log(pdf));
} catch (err) {
  console.error("Error searching for PDFs:", err);
}
