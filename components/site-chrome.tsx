'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { FloatingActions } from '@/components/floating-actions'

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Map page manages its own full-height layout without a footer.
  const isMap = pathname.startsWith('/map')

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-20">{children}</main>
      {!isMap && <Footer />}
      <FloatingActions />
    </div>
  )
}
