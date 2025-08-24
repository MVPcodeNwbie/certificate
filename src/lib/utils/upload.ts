/**
 * Client-side upload utility with external auth integration
 */

interface UploadOptions {
  file: File;
  artifactMeta: {
    title: string;
    type: string;
    description?: string;
    issuer?: string;
    date?: string;
    tags?: string[];
  };
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  success: boolean;
  artifactId?: string;
  error?: string;
}

/**
 * Upload file and create artifact with external auth
 * Assumes auth token/headers are already set globally or in session
 */
export async function uploadArtifact(options: UploadOptions): Promise<UploadResult> {
  const { file, artifactMeta, onProgress } = options;

  try {
    // Step 1: Validate file constraints
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'File too large. Maximum 5MB allowed.' };
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Only PDF, JPG, PNG, WebP allowed.' };
    }

    onProgress?.(10);

    // Step 2: Get signed upload URL
    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Auth headers will be automatically included by browser/session
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        artifactMeta
      })
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      return { success: false, error: error.error || 'Failed to get upload URL' };
    }

    const { uploadUrl, artifactId, filePath } = await uploadResponse.json();
    onProgress?.(30);

    // Step 3: Upload file to signed URL
    const fileUploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      }
    });

    if (!fileUploadResponse.ok) {
      return { success: false, error: 'File upload failed' };
    }

    onProgress?.(70);

    // Step 4: Create artifact metadata
    const artifactResponse = await fetch('/api/artifact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        artifactId,
        filePath,
        fileUrl: `https://storage.googleapis.com/${getBucketName()}/${filePath}`,
        ...artifactMeta,
        visibility: 'school' // Default visibility
      })
    });

    if (!artifactResponse.ok) {
      const error = await artifactResponse.json();
      return { success: false, error: error.error || 'Failed to create artifact' };
    }

    onProgress?.(100);

    return {
      success: true,
      artifactId
    };

  } catch (error) {
    console.error('Upload failed:', error);
    return {
      success: false,
      error: 'Upload failed due to network error'
    };
  }
}

/**
 * Get auth headers from current session
 * Implementation depends on how external auth is integrated
 */
function getAuthHeaders(): Record<string, string> {
  // Option 1: From session storage/cookies
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }

  // Option 2: From global variables (set by main system)
  // @ts-ignore
  if (window.__AUTH_CONTEXT) {
    // @ts-ignore
    const auth = window.__AUTH_CONTEXT;
    return {
      'x-user-id': auth.userId,
      'x-school-id': auth.schoolId,
      'x-user-role': auth.role,
      'x-user-display-name': auth.displayName || ''
    };
  }

  return {};
}

/**
 * Get storage bucket name from environment
 */
function getBucketName(): string {
  // This should match your Firebase storage bucket
  return import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com';
}
