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

/**
 * Load reCAPTCHA script dynamically
 */
function loadRecaptchaScript(siteKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script already exists
    if (document.querySelector(`script[src*="recaptcha/api.js"]`)) {
      if (window.grecaptcha) {
        resolve()
      } else {
        reject(new Error('reCAPTCHA script loaded but grecaptcha not available'))
      }
      return
    }

    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA script'))
    document.head.appendChild(script)
  })
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
