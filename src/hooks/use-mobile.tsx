import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initialize with undefined to indicate "not yet determined"
  // This prevents hydration mismatch by not rendering mobile-specific content until mounted
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  const [hasMounted, setHasMounted] = React.useState(false)

  React.useEffect(() => {
    setHasMounted(true)
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Return false during SSR/initial render to maintain consistency
  // Only return actual mobile state after component has mounted
  if (!hasMounted) {
    return false
  }
  
  return !!isMobile
}
