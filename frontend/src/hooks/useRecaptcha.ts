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
 * Hook to use reCAPTCHA v3
 * @returns executeRecaptcha function to get token
 */
export function useRecaptcha() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Check if reCAPTCHA is already loaded
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => {
        setIsReady(true)
      })
    } else {
      // Wait for script to load
      const checkRecaptcha = setInterval(() => {
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => {
            setIsReady(true)
            clearInterval(checkRecaptcha)
          })
        }
      }, 100)

      return () => clearInterval(checkRecaptcha)
    }
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
