/**
 * useSignupVerification - React Hook for Pre-signup Verification
 * Checks if signup will be allowed before user attempts registration
 * 
 * Usage:
 * const { checkSignup, isLoading, error } = useSignupVerification();
 * const result = await checkSignup(email);
 * if (result.allowed) {
 *   // Safe to proceed with signup
 * } else {
 *   // Show error to user
 * }
 */

import { useState } from 'react';

export function useSignupVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkSignup = async (email) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/signup-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error(`Signup verification failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.allowed) {
        setError(result.reason);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup verification error';
      setError(errorMessage);
      console.error('[SIGNUP VERIFY]', errorMessage);

      // Fail open - allow signup if verification fails
      return {
        allowed: true,
        warning: true,
        message: 'Could not verify signup, proceeding...'
      };
    } finally {
      setIsLoading(false);
    }
  };

  return { checkSignup, isLoading, error };
}

export default useSignupVerification;
