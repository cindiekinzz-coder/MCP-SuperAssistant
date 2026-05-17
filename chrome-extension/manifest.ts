import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

// KISS fork: ChatGPT only, talks to local mcp-discord on http://localhost:8080/mcp.
// Stripped from MCP-SuperAssistant — see README for what was removed.
const manifest = {
  manifest_version: 3,
  default_locale: 'en',
  name: 'Gremy Discord Bridge',
  browser_specific_settings: {
    gecko: {
      id: 'gremy-discord-bridge@cindiekinzz.dev',
    },
  },
  version: packageJson.version,
  description: 'Bridges ChatGPT to a local mcp-discord server. ChatGPT only, Discord only, no proxy.',
  host_permissions: [
    '*://*.chatgpt.com/*',
    '*://*.chat.openai.com/*',
    '*://*.gemini.google.com/*',
    'http://localhost/*',
    'http://localhost:*/*',
    'http://127.0.0.1/*',
    'http://127.0.0.1:*/*',
  ],
  permissions: ['storage', 'clipboardWrite'],
  background: {
    service_worker: 'background.js',
    type: 'module',
  },
  icons: {
    128: 'icon-128.png',
    34: 'icon-34.png',
  },
  content_scripts: [
    {
      matches: ['*://*.chatgpt.com/*', '*://*.chat.openai.com/*'],
      js: ['content/index.iife.js'],
      run_at: 'document_idle',
    },
    {
      matches: ['*://*.gemini.google.com/*'],
      js: ['content/index.iife.js'],
      run_at: 'document_idle',
    },
  ],
  web_accessible_resources: [
    {
      resources: ['*.js', '*.css', 'content/*.css', '*.svg', 'icon-128.png', 'icon-34.png'],
      matches: ['*://*/*'],
    },
  ],
} satisfies chrome.runtime.ManifestV3;

export default manifest;
