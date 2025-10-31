#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const siteDir = path.join(rootDir, "site");

// Clean and create site directory
if (fs.existsSync(siteDir)) {
  fs.rmSync(siteDir, { recursive: true, force: true });
}
fs.mkdirSync(siteDir, { recursive: true });

// Copy main index.html
fs.copyFileSync(path.join(rootDir, "index.html"), path.join(siteDir, "index.html"));

// Copy examples directory
const examplesDir = path.join(rootDir, "examples");
const siteExamplesDir = path.join(siteDir, "examples");
if (fs.existsSync(examplesDir)) {
  copyDirectory(examplesDir, siteExamplesDir);
}

// Copy built packages
const packagesDir = path.join(rootDir, "packages");
const sitePackagesDir = path.join(siteDir, "packages");
fs.mkdirSync(sitePackagesDir, { recursive: true });

// Get all package directories
const packageDirs = fs
  .readdirSync(packagesDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

for (const packageName of packageDirs) {
  const packagePath = path.join(packagesDir, packageName);
  const packageSitePath = path.join(sitePackagesDir, packageName);

  // Create package directory in site
  fs.mkdirSync(packageSitePath, { recursive: true });

  // Copy dist directory if it exists
  const distPath = path.join(packagePath, "dist");
  if (fs.existsSync(distPath)) {
    const siteDistPath = path.join(packageSitePath, "dist");
    copyDirectory(distPath, siteDistPath);
  }

  // Copy css directory if it exists
  const cssPath = path.join(packagePath, "css");
  if (fs.existsSync(cssPath)) {
    const siteCssPath = path.join(packageSitePath, "css");
    copyDirectory(cssPath, siteCssPath);
  }
}

// Copy any additional assets
const assetsToCheck = ["assets", "img", "images", "media"];
for (const assetDir of assetsToCheck) {
  const assetPath = path.join(rootDir, assetDir);
  if (fs.existsSync(assetPath)) {
    const siteAssetPath = path.join(siteDir, assetDir);
    copyDirectory(assetPath, siteAssetPath);
  }
}

console.log("✅ Site built successfully in site directory");

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
