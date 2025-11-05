#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Read VERSION file
const versionFile = path.join(__dirname, '..', 'VERSION');
const version = fs.readFileSync(versionFile, 'utf8').trim();

// Update package.json
const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = version;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

console.log(`✓ Synced version ${version} to package.json`);