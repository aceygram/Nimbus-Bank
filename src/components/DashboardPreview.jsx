import logoImg from '../assets/Nimbus-logo.png'; 

export default function DashboardPreview() {
  return (
    <div className="bg-ink border border-white/10 rounded-[32px] shadow-2xl p-6 sm:p-8 w-full max-w-[1000px] mx-auto overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-6">
        {/* mini sidebar */}
        <div className="hidden sm:flex flex-col gap-5 border-r border-white/10 pr-6">
          <div className="flex items-center gap-2 m-auto">
            <img src={logoImg} alt="Nimbus Bank Logo" className="w-20 h-20"/>
          </div>
          <div className="flex flex-col gap-2 num text-sm">
            <span className="bg-blue/20 text-[#B1C5FF] rounded-lg px-3 py-2">Home</span>
            <span className="text-white/60 px-3 py-2">Payments</span>
            <span className="text-white/60 px-3 py-2">Cards</span>
          </div>
        </div>

        {/* main content */}
        <div className="flex flex-col gap-6">
          <div className="flex items-end flex-wrap gap-3 justify-between">
            <div>
              <p className="num text-sm text-white/60">Current Balance</p>
              <p className="num text-4xl sm:text-5xl font-semibold text-white tracking-tight">$32,607.59</p>
            </div>
            <div className="flex gap-4 text-right">
              <div>
                <p className="num text-xs text-white/60">Income</p>
                <p className="font-semibold text-mint text-lg">$9,230.89</p>
              </div>
              <div>
                <p className="num text-xs text-white/60">Expenses</p>
                <p className="font-semibold text-coral text-lg">$2,153.97</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-white text-sm">Recent Transactions</p>
                <span className="num text-xs text-blue">View All</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-white font-bold">Apple Store</span>
                <span className="text-white font-bold">-$1,299.00</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white font-bold">Remote Inc.</span>
                <span className="text-mint font-bold">+$4,500.00</span>
              </div>
            </div>
            <div className="bg-blue/10 border border-blue/20 rounded-2xl p-5">
              <p className="font-bold text-white text-sm mb-3">Spending Limit</p>
              <div className="h-2 rounded-full bg-white/10 mb-2">
                <div className="h-2 rounded-full bg-blue w-3/4" />
              </div>
              <p className="text-xs text-white/60">75% of monthly budget used</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
