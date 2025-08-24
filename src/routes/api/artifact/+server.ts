/**
 * Artifact creation endpoint after successful file upload
 * POST /api/artifact - Create artifact metadata in Firestore
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateAuth } from '$lib/auth/external-auth';
import { adminFirestore } from '$lib/firebase/admin';

interface ArtifactRequest {
  artifactId: string;
  filePath: string;
  fileUrl?: string;
  title: string;
  type: 'certificate' | 'diploma' | 'award' | 'competition' | 'training' | 'other';
  description?: string;
  issuer?: string;
  date?: string;
  tags?: string[];
  visibility: 'public' | 'school' | 'private';
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

    const { userId, schoolId, role, displayName } = authResult.context!;
    const body: ArtifactRequest = await request.json();

    // Validate required fields
    if (!body.artifactId || !body.title || !body.type) {
      return json(
        { error: 'Missing required fields: artifactId, title, type' },
        { status: 400 }
      );
    }

    // Create artifact document
    const artifactData = {
      ownerId: userId,
      ownerName: displayName || 'Unknown User',
      ownerRole: role,
      schoolId,
      title: body.title,
      type: body.type,
      description: body.description,
      issuer: body.issuer,
      date: body.date,
      tags: body.tags || [],
      visibility: body.visibility || 'school',
      certificateFiles: body.filePath ? [{
        path: body.filePath,
        url: body.fileUrl,
        mimeType: getMimeTypeFromPath(body.filePath),
        sizeBytes: 0 // Will be updated by Cloud Function
      }] : [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Save to Firestore
    await adminFirestore
      .collection('artifacts')
      .doc(body.artifactId)
      .set(artifactData);

    // Create search metadata (will be enhanced by Cloud Function)
    const searchMetadata = {
      fullText: `${body.title} ${body.description || ''} ${body.issuer || ''} ${displayName}`.toLowerCase(),
      facets: {
        type: body.type,
        role: role,
        schoolId: schoolId,
        year: body.date ? new Date(body.date).getFullYear() : null,
        tags: body.tags || []
      }
    };

    await adminFirestore
      .collection('searchMetadata')
      .doc(body.artifactId)
      .set(searchMetadata);

    return json({
      success: true,
      artifactId: body.artifactId,
      message: 'Artifact created successfully'
    });

  } catch (error) {
    console.error('Artifact creation failed:', error);
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

function getMimeTypeFromPath(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp'
  };
  return mimeTypes[extension || ''] || 'application/octet-stream';
}
