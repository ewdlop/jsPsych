#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Check for help flag
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
🚀 jsPsych GitHub Pages Deployment Script

Usage: node scripts/deploy-gh-pages.js

This script will:
1. Check if git is installed
2. Verify you're in a git repository with remote configured
3. Build the site files
4. Create a temporary gh-pages branch
5. Copy all site files to the branch
6. Push to GitHub Pages

Requirements:
- Git must be installed and available in PATH
- Must be run from a git repository
- Git remote 'origin' or 'upstream' must be configured
- Site files must exist in the 'site' directory

To build the site first, run: npm run build:site
  `);
  process.exit(0);
}

const siteDir = "site";
const ghPagesDir = ".gh-pages-temp";

console.log("🚀 Deploying to GitHub Pages...");

// Check if git is installed
try {
  execSync("git --version", { stdio: "pipe" });
  console.log("✅ Git is installed");
} catch (error) {
  console.error("❌ Git is not installed or not available in PATH");
  console.error("Please install Git from https://git-scm.com/ and make sure it's in your PATH");
  process.exit(1);
}

// Check if we're in a git repository
try {
  execSync("git rev-parse --git-dir", { stdio: "pipe" });
  console.log("✅ Git repository detected");
} catch (error) {
  console.error("❌ Not in a git repository");
  console.error("Please run this command from the root of a git repository");
  console.error("Initialize a git repository with: git init");
  process.exit(1);
}

// Check if site directory exists
if (!fs.existsSync(siteDir)) {
  console.error(`❌ Site directory '${siteDir}' not found`);
  console.error('Please run "npm run build:site" first to create the site files');
  process.exit(1);
}
console.log("✅ Site directory found");

try {
  // Clean up any existing temp directory
  if (fs.existsSync(ghPagesDir)) {
    fs.rmSync(ghPagesDir, { recursive: true, force: true });
  }

  // Create temp directory for gh-pages branch
  fs.mkdirSync(ghPagesDir, { recursive: true });

  // Initialize git repo in temp directory
  process.chdir(ghPagesDir);

  execSync("git init", { stdio: "inherit" });
  execSync("git checkout -b gh-pages", { stdio: "inherit" });

  // Copy site contents to temp directory
  process.chdir("..");
  console.log("📁 Copying site files...");

  // Use robocopy on Windows for better performance with many files
  try {
    execSync(`robocopy "${siteDir}" "${ghPagesDir}" /E /XD .git`, { stdio: "pipe" });
  } catch (error) {
    // Robocopy exit codes 0-7 are actually success, only 8+ are errors
    if (error.status > 7) {
      throw error;
    }
  }

  // Go back to temp directory and commit
  process.chdir(ghPagesDir);

  // Configure git user if not already configured
  try {
    execSync("git config user.name", { stdio: "pipe" });
  } catch {
    execSync('git config user.name "GitHub Pages Deploy"', { stdio: "inherit" });
    execSync('git config user.email "noreply@github.com"', { stdio: "inherit" });
  }

  execSync("git add .", { stdio: "inherit" });
  execSync(`git commit -m "Deploy to GitHub Pages - ${new Date().toISOString()}"`, {
    stdio: "inherit",
  });

  // Get the remote URL from the main repo
  process.chdir("..");
  let remoteUrl;
  try {
    remoteUrl = execSync("git remote get-url origin", { encoding: "utf8" }).trim();
  } catch {
    try {
      remoteUrl = execSync("git remote get-url upstream", { encoding: "utf8" }).trim();
    } catch {
      console.error("❌ No git remote found (origin or upstream)");
      process.exit(1);
    }
  }

  // Go back to temp directory and add remote
  process.chdir(ghPagesDir);
  execSync(`git remote add origin "${remoteUrl}"`, { stdio: "inherit" });

  // Push to gh-pages branch
  console.log("⬆️  Pushing to gh-pages branch...");
  execSync("git push origin gh-pages --force", { stdio: "inherit" });

  // Clean up
  process.chdir("..");
  fs.rmSync(ghPagesDir, { recursive: true, force: true });

  console.log("✅ Successfully deployed to GitHub Pages!");
} catch (error) {
  console.error("❌ Deployment failed:", error.message);

  // Clean up on error
  try {
    process.chdir("..");
    if (fs.existsSync(ghPagesDir)) {
      fs.rmSync(ghPagesDir, { recursive: true, force: true });
    }
  } catch (cleanupError) {
    console.error("Failed to clean up:", cleanupError.message);
  }

  process.exit(1);
}
