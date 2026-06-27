import Sidebar from '@/components/Sidebar'
import TrialBanner from '@/components/TrialBanner'

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6 sm:p-8">
          <TrialBanner />
          {children}
        </div>
      </main>
    </div>
  )
}
