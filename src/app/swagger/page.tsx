'use client';

import { useEffect, useState } from 'react';

type SwaggerUiBundle = {
  (config: {
    url: string;
    dom_id: string;
    deepLinking: boolean;
    presets: unknown[];
    layout: string;
  }): unknown;
  presets: {
    apis: unknown;
  };
};

type SwaggerWindow = Window & {
  SwaggerUIBundle?: SwaggerUiBundle;
  SwaggerUIStandalonePreset?: unknown;
};

const SWAGGER_UI_CSS_ID = 'swagger-ui-css';
const SWAGGER_UI_BUNDLE_SRC =
  'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js';
const SWAGGER_UI_PRESET_SRC =
  'https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js';

function ensureSwaggerCss() {
  if (document.getElementById(SWAGGER_UI_CSS_ID)) {
    return;
  }

  const link = document.createElement('link');
  link.id = SWAGGER_UI_CSS_ID;
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css';
  document.head.appendChild(link);
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector(
      `script[data-swagger-src="${src}"]`
    ) as HTMLScriptElement | null;

    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        resolve();
      } else {
        existingScript.addEventListener('load', () => resolve(), {
          once: true,
        });
        existingScript.addEventListener(
          'error',
          () => reject(new Error(`Failed to load ${src}`)),
          { once: true }
        );
      }
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.swaggerSrc = src;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export default function SwaggerPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function mountSwaggerUi() {
      try {
        ensureSwaggerCss();
        await loadScript(SWAGGER_UI_BUNDLE_SRC);
        await loadScript(SWAGGER_UI_PRESET_SRC);

        if (cancelled) {
          return;
        }

        const swaggerWindow = window as SwaggerWindow;

        if (!swaggerWindow.SwaggerUIBundle) {
          throw new Error('Swagger UI bundle did not initialize');
        }

        swaggerWindow.SwaggerUIBundle({
          url: '/api/swagger',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            swaggerWindow.SwaggerUIBundle.presets.apis,
            swaggerWindow.SwaggerUIStandalonePreset ?? {},
          ],
          layout: 'BaseLayout',
        });
      } catch (mountError) {
        const message =
          mountError instanceof Error
            ? mountError.message
            : 'Unable to load Swagger UI';
        setError(message);
      }
    }

    void mountSwaggerUi();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-white">
      {error ? (
        <div className="mx-auto max-w-3xl p-6 text-red-700">
          <h1 className="mb-2 text-2xl font-bold">Swagger failed to load</h1>
          <p>{error}</p>
          <p className="mt-2 text-sm text-red-600">
            Try reloading the page, then confirm `/api/swagger` returns YAML.
          </p>
        </div>
      ) : null}
      <div id="swagger-ui" />
    </main>
  );
}
