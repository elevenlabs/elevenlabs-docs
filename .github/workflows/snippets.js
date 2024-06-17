const fs = require('fs');

async function downloadOpenAPISpecs() {
  console.log('Downloading OpenAPI...');
  const url = 'https://api.elevenlabs.io/openapi.json';
  const response = await fetch(url);
  const oas = await response.json();

  console.log('Fetched OpenAPI spec');
  return oas;
}

function getFirstRelevantSnippets(snippets) {
  const results = [];
  const latestTypescriptSnippet = snippets.find(
    (snippet) => snippet.type === 'typescript'
  )?.client;
  const latestPythonSnippet = snippets.find(
    (snippet) => snippet.type === 'python'
  )?.sync_client;

  if (latestTypescriptSnippet) {
    results.push({
      lang: 'TypeScript',
      source: latestTypescriptSnippet,
    });
  }

  if (latestPythonSnippet) {
    results.push({
      lang: 'Python',
      source: latestPythonSnippet,
    });
  }

  return results;
}

async function fetchSnippetFromEndpoint(path, method) {
  const url = `https://api.buildwithfern.com/snippets`;

  try {
    const response = await fetch(url, {
      body: JSON.stringify({
        endpoint: {
          path,
          method: method.toUpperCase(),
        },
      }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FERN_API_KEY}`,
      },
    });

    const snippets = await response.json();
    return snippets;
  } catch {
    return;
  }
}

async function appendSnippets() {
  let oas = await downloadOpenAPISpecs();
  const endpoints = [];

  Object.entries(oas.paths).map(([path, methods]) => {
    Object.entries(methods).map(([method]) => {
      endpoints.push({
        path,
        method,
      });
    });
  });

  console.log('Fetching snippets...');

  await Promise.all(
    endpoints.map(async ({ path, method }) => {
      const snippets = await fetchSnippetFromEndpoint(path, method);

      const relevantSnippets = getFirstRelevantSnippets(snippets);

      if (relevantSnippets) {
        oas.paths[path][method]['x-codeSamples'] = relevantSnippets;
      }
    })
  );

  console.log('Found all matching snippets.');
  console.log('Created OpenAPI spec with snippets');

  fs.writeFileSync('openapi.json', JSON.stringify(oas, null, `\t`), {
    encoding: 'utf8',
  });

  console.log('Completed! ✅');
}

if (typeof window === 'undefined') {
  appendSnippets();
}
