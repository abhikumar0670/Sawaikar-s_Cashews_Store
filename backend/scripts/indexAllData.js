#!/usr/bin/env node
/**
 * Index All Data Script
 * Master script to index all products, FAQs, and reviews
 * Run: node backend/scripts/indexAllData.js
 */

require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

const scripts = [
  { name: 'indexFAQs.js', description: 'Indexing FAQs...' },
  { name: 'indexProducts.js', description: 'Indexing Products...' },
  { name: 'indexReviews.js', description: 'Indexing Reviews...' },
];

async function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    const child = spawn('node', [scriptPath]);

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Script ${scriptName} exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║        RAG DATA INDEXING - MASTER SCRIPT              ║');
  console.log('║     Indexing all products, FAQs, and reviews          ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');

  try {
    for (const script of scripts) {
      console.log(`\n🔄 ${script.description}`);
      console.log('─'.repeat(50));
      await runScript(script.name);
      console.log('─'.repeat(50));
    }

    console.log('');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║        ✅ ALL INDEXING COMPLETED SUCCESSFULLY          ║');
    console.log('║  Your chatbot is now powered by RAG!                  ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Indexing failed:', error.message);
    process.exit(1);
  }
}

main();
