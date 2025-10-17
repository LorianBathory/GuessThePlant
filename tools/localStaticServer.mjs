#!/usr/bin/env node

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_PORT = 4173;
const DEFAULT_HOST = '127.0.0.1';

const MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2']
]);

function resolveRootDirectory() {
  const [, , rawTarget] = process.argv;

  if (!rawTarget) {
    return process.cwd();
  }

  if (path.isAbsolute(rawTarget)) {
    return rawTarget;
  }

  return path.resolve(process.cwd(), rawTarget);
}

function resolvePort() {
  const fromEnv = Number.parseInt(process.env.PORT ?? '', 10);

  if (Number.isInteger(fromEnv) && fromEnv > 0) {
    return fromEnv;
  }

  const fromArg = Number.parseInt(process.argv[3] ?? '', 10);

  if (Number.isInteger(fromArg) && fromArg > 0) {
    return fromArg;
  }

  return DEFAULT_PORT;
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES.get(ext) ?? 'application/octet-stream';
}

function sendNotFound(response) {
  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found');
}

function sendServerError(response, error) {
  response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(`Internal server error: ${error?.message ?? error}`);
}

function normalizeRequestPath(rawPath) {
  const basePath = rawPath.split('?')[0] ?? '/';
  return decodeURIComponent(basePath);
}

async function resolveFilePath(rootDir, requestPath) {
  const relativePath = requestPath === '/' ? '/index.html' : requestPath;
  const resolvedPath = path.join(rootDir, relativePath);
  const normalizedPath = path.normalize(resolvedPath);
  const relativeToRoot = path.relative(rootDir, normalizedPath);

  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    return null;
  }

  try {
    const stats = await fs.stat(normalizedPath);

    if (stats.isDirectory()) {
      const indexPath = path.join(normalizedPath, 'index.html');
      const indexStats = await fs.stat(indexPath);

      if (indexStats.isFile()) {
        return indexPath;
      }

      return null;
    }

    if (stats.isFile()) {
      return normalizedPath;
    }

    return null;
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

function logStartMessage(host, port, rootDir) {
  const relativeRoot = path.relative(process.cwd(), rootDir) || '.';
  const hostForDisplay = host === '127.0.0.1' ? 'localhost' : host;
  console.log(`Serving ${relativeRoot} at http://${hostForDisplay}:${port}`);
  console.log('Press Ctrl+C to stop the server.');
}

async function main() {
  const rootDir = path.resolve(resolveRootDirectory());
  const host = process.env.HOST || DEFAULT_HOST;
  const port = resolvePort();

  const server = createServer(async (request, response) => {
    if (!request || !response) {
      return;
    }

    try {
      const requestPath = normalizeRequestPath(request.url || '/');
      const filePath = await resolveFilePath(rootDir, requestPath);

      if (!filePath) {
        sendNotFound(response);
        return;
      }

      response.writeHead(200, {
        'Content-Type': getContentType(filePath),
        'Cache-Control': 'no-store'
      });

      const stream = createReadStream(filePath);
      stream.on('error', (error) => {
        sendServerError(response, error);
      });
      stream.pipe(response);
    } catch (error) {
      sendServerError(response, error);
    }
  });

  server.listen(port, host, () => {
    logStartMessage(host, port, rootDir);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Failed to start the local static server.');
  console.error(error);
  process.exitCode = 1;
});
