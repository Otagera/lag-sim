import { BudgetPanel } from './ui/BudgetPanel'
import { Dashboard } from './ui/Dashboard'
import { EventCard } from './ui/EventCard'
import { FactionPanel } from './ui/FactionPanel'
import { GodfatherInbox } from './ui/GodfatherInbox'
import { PollPanel } from './ui/PollPanel'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Lagos Governor Sim</h1>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Dashboard />
          <EventCard />
        </div>
        <div className="space-y-4">
          <FactionPanel />
          <BudgetPanel />
          <PollPanel />
          <GodfatherInbox />
        </div>
      </div>
    </div>
  )
}

export default App
