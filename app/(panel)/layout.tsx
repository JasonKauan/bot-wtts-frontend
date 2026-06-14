import Sidebar from '@/components/Sidebar'
import TrialBanner from '@/components/TrialBanner'

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <TrialBanner />
        {children}
      </main>
    </div>
  )
}
