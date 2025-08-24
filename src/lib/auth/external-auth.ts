/**
 * Authentication middleware for external auth system integration
 * Validates tokens and headers from main system
 */

export interface AuthContext {
  userId: string;
  schoolId: string;
  role: 'admin' | 'teacher' | 'student';
  displayName?: string;
}

export interface AuthValidationResult {
  success: boolean;
  context?: AuthContext;
  error?: string;
}

/**
 * Validate external authentication token/headers
 */
export async function validateAuth(request: Request): Promise<AuthValidationResult> {
  // Method 1: Bearer token
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return await validateBearerToken(token);
  }
  
  // Method 2: Direct headers (pre-validated by reverse proxy)
  const userId = request.headers.get('x-user-id');
  const schoolId = request.headers.get('x-school-id');
  const userRole = request.headers.get('x-user-role') as 'admin' | 'teacher' | 'student';
  
  if (userId && schoolId && userRole) {
    return {
      success: true,
      context: {
        userId,
        schoolId,
        role: userRole,
        displayName: request.headers.get('x-user-display-name') || undefined
      }
    };
  }
  
  return {
    success: false,
    error: 'Missing or invalid authentication credentials'
  };
}

/**
 * Validate bearer token with internal auth service
 */
async function validateBearerToken(token: string): Promise<AuthValidationResult> {
  try {
    // Replace with actual internal auth service endpoint
    const response = await fetch(`${process.env.INTERNAL_AUTH_SERVICE_URL}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      return { success: false, error: 'Invalid token' };
    }
    
    const data = await response.json();
    return {
      success: true,
      context: {
        userId: data.userId,
        schoolId: data.schoolId,
        role: data.role,
        displayName: data.displayName
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: 'Auth service unavailable' 
    };
  }
}
