import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function GET() {
  try {
    const specPath = path.join(process.cwd(), 'swagger', 'swagger.yaml');
    const specContent = await readFile(specPath, 'utf8');

    return new NextResponse(specContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/yaml; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? `Unable to load swagger spec: ${error.message}`
        : 'Unable to load swagger spec';

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
