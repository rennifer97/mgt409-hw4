import { useEffect } from 'react'

// Each page gets its own browser-tab title, which screen readers announce on navigation.
export default function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Campus Customs` : 'Campus Customs'
  }, [title])
}
