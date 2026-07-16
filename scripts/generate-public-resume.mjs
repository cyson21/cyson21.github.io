import { chromium } from '@playwright/test';
import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';

const output = resolve(import.meta.dirname, '../public/downloads/resume.pdf');
const temporaryOutput = resolve(dirname(output), `.resume-${process.pid}-${Date.now()}.tmp.pdf`);
const sourceUrl = process.env.RESUME_SOURCE_URL?.trim() || 'http://127.0.0.1:4321/resume/print/';
const readyMarker = process.env.RESUME_READY_SELECTOR?.trim() || 'main > .sheet';
const expectedPages = 2;

mkdirSync(dirname(output), { recursive: true });

let browser;
try {
  const launchOptions = process.env.CI
    ? {}
    : { channel: process.env.PLAYWRIGHT_CHANNEL?.trim() || 'chrome' };
  browser = await chromium.launch(launchOptions);
  const page = await browser.newPage();
  const response = await page.goto(sourceUrl, { waitUntil: 'networkidle' });
  if (!response) throw new Error(`Resume source returned no HTTP response: ${sourceUrl}`);
  if (!response.ok()) throw new Error(`Resume source returned HTTP ${response.status()}: ${sourceUrl}`);

  const markers = page.locator(readyMarker);
  await markers.last().waitFor({ state: 'visible', timeout: 30_000 });
  const markerCount = await markers.count();
  if (markerCount !== expectedPages) {
    throw new Error(`Resume marker count must be ${expectedPages}, received ${markerCount}: ${readyMarker}`);
  }

  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: temporaryOutput,
    format: 'A4',
    preferCSSPageSize: true,
    printBackground: true,
    tagged: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  const bytes = readFileSync(temporaryOutput);
  if (statSync(temporaryOutput).size < 1024 || bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new Error('Generated resume is not a valid PDF');
  }

  renameSync(temporaryOutput, output);
  console.log(`Generated public resume atomically: ${output}`);
} finally {
  rmSync(temporaryOutput, { force: true });
  await browser?.close();
}
