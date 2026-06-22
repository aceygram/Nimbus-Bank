export default function PhoneMock() {
  return (
    <div className="relative w-[280px] sm:w-[300px] rounded-[2.5rem] bg-ink p-3 shadow-2xl shadow-ink/30 rotate-2">
      <div className="rounded-[2rem] bg-mist overflow-hidden h-[560px] flex flex-col">
        {/* status bar */}
        <div className="flex justify-between items-center px-5 pt-3 text-[11px] text-slate font-medium">
          <span>9:41</span>
          <span className="num">●●●</span>
        </div>

        {/* balance card */}
        <div className="mx-4 mt-4 rounded-2xl bg-ink text-white p-5">
          <p className="text-[11px] text-white/60 mb-1">Available balance</p>
          <p className="num text-3xl font-semibold tracking-tight">$2,845.10</p>
          <div className="flex justify-between mt-4 text-[11px] text-white/60">
            <span className="num">4920 8831 0027</span>
            <span>NIMBUS</span>
          </div>
        </div>

        {/* quick actions */}
        <div className="grid grid-cols-4 gap-2 px-4 mt-4">
          {["Send", "Request", "Bills", "More"].map((label) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-paper border border-line flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-mint" />
              </div>
              <span className="text-[10px] text-slate font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* activity preview */}
        <div className="px-4 mt-5 flex-1">
          <p className="text-[11px] font-semibold text-ink mb-2">Recent activity</p>
          {[
            { name: "Maya Chen", amt: "+$450.00", pos: true },
            { name: "Internet bill", amt: "−$20.00", pos: false },
            { name: "Liam Carter", amt: "−$185.50", pos: false },
          ].map((tx) => (
            <div key={tx.name} className="flex justify-between items-center py-2 border-b border-line/70">
              <span className="text-[12px] text-ink font-medium">{tx.name}</span>
              <span className={`num text-[12px] font-semibold ${tx.pos ? "text-mint-deep" : "text-ink"}`}>
                {tx.amt}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
