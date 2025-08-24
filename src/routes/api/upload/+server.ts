/**
 * Upload API endpoint with external auth validation
 * POST /api/upload - Returns signed upload URL
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateAuth } from '$lib/auth/external-auth';
import { adminStorage } from '$lib/firebase/admin';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg', 
  'image/png',
  'image/webp'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface UploadRequest {
  filename: string;
  size: number;
  mimeType: string;
  artifactMeta: {
    title: string;
    type: string;
    description?: string;
  };
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Validate authentication
    const authResult = await validateAuth(request);
    if (!authResult.success) {
      return json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const { userId, schoolId } = authResult.context!;
    const body: UploadRequest = await request.json();

    // Validate file constraints
    if (!ALLOWED_MIME_TYPES.includes(body.mimeType)) {
      return json(
        { error: 'Invalid file type. Only PDF, JPG, PNG, WebP allowed.' },
        { status: 400 }
      );
    }

    if (body.size > MAX_FILE_SIZE) {
      return json(
        { error: 'File too large. Maximum 5MB allowed.' },
        { status: 400 }
      );
    }

    // Generate unique file path
    const artifactId = crypto.randomUUID();
    const fileExtension = getFileExtension(body.mimeType);
    const fileName = `${Date.now()}_${body.filename}${fileExtension}`;
    const filePath = `certificates/${schoolId}/${userId}/${artifactId}/${fileName}`;

    // Generate signed upload URL
    const bucket = adminStorage.bucket();
    const file = bucket.file(filePath);
    
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: body.mimeType,
    });

    // Return upload URL and metadata for client
    return json({
      uploadUrl: signedUrl,
      artifactId,
      filePath,
      expiresAt: Date.now() + 15 * 60 * 1000
    });

  } catch (error) {
    console.error('Upload URL generation failed:', error);
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp'
  };
  return extensions[mimeType] || '';
}
