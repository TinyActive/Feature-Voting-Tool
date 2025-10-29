import { useEffect, useState } from 'react'

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
      render: (container: string | HTMLElement, parameters: any) => number
    }
  }
}

// Track loading state globally to prevent multiple loads
let recaptchaLoadPromise: Promise<void> | null = null

/**
 * Load reCAPTCHA script dynamically
 */
function loadRecaptchaScript(siteKey: string): Promise<void> {
  // Return existing promise if already loading
  if (recaptchaLoadPromise) {
    return recaptchaLoadPromise
  }

  recaptchaLoadPromise = new Promise((resolve, reject) => {
    // Check if grecaptcha is already available
    if (window.grecaptcha && typeof window.grecaptcha.ready === 'function') {
      resolve()
      return
    }

    // Check if script already exists
    const existingScript = document.querySelector(`script[src*="recaptcha/api.js"]`)
    if (existingScript) {
      // Script exists, wait for grecaptcha to be ready
      let resolved = false
      const checkInterval = setInterval(() => {
        if (window.grecaptcha && typeof window.grecaptcha.ready === 'function') {
          if (!resolved) {
            resolved = true
            clearInterval(checkInterval)
            resolve()
          }
        }
      }, 100)
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          clearInterval(checkInterval)
          reject(new Error('reCAPTCHA script timeout'))
        }
      }, 10000)
      return
    }

    // Load new script
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      // Wait for grecaptcha to be ready after script loads
      let resolved = false
      const checkReady = setInterval(() => {
        if (window.grecaptcha && typeof window.grecaptcha.ready === 'function') {
          if (!resolved) {
            resolved = true
            clearInterval(checkReady)
            resolve()
          }
        }
      }, 50)
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          clearInterval(checkReady)
          reject(new Error('grecaptcha not ready after script load'))
        }
      }, 5000)
    }
    
    script.onerror = () => {
      recaptchaLoadPromise = null
      reject(new Error('Failed to load reCAPTCHA script'))
    }
    
    document.head.appendChild(script)
  })

  return recaptchaLoadPromise
}

/**
 * Hook to use reCAPTCHA v3
 * @returns executeRecaptcha function to get token
 */
export function useRecaptcha() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) {
      console.warn('reCAPTCHA site key not configured')
      return
    }

    // Load reCAPTCHA script
    loadRecaptchaScript(RECAPTCHA_SITE_KEY)
      .then(() => {
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => {
            setIsReady(true)
          })
        }
      })
      .catch((error) => {
        console.error('Failed to load reCAPTCHA:', error)
      })
  }, [])

  /**
   * Execute reCAPTCHA and get token
   * @param action - Action name for this reCAPTCHA execution
   * @returns reCAPTCHA token
   */
  const executeRecaptcha = async (action: string): Promise<string> => {
    if (!RECAPTCHA_SITE_KEY) {
      console.warn('reCAPTCHA site key not configured')
      return ''
    }

    if (!isReady) {
      throw new Error('reCAPTCHA not ready')
    }

    try {
      const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action })
      return token
    } catch (error) {
      console.error('reCAPTCHA execution error:', error)
      throw new Error('Failed to verify security check')
    }
  }

  return { executeRecaptcha, isReady }
}
