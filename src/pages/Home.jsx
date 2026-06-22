import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import PhoneMock from "../components/PhoneMock";

const FEATURES = [
  {
    title: "Instant transfers",
    body: "Send to any Nimbus account number and it lands in seconds, not 'within 24 hours.'",
  },
  {
    title: "Sub-accounts",
    body: "Split savings, bills, and spending into separate accounts without opening new ones.",
  },
  {
    title: "Real-time ledger",
    body: "Every cent is logged the moment it moves. No end-of-day batch processing.",
  },
  {
    title: "Built-in limits",
    body: "Set your own transfer caps and freeze your card from the app in one tap.",
  },
];

const STATS = [
  { value: "2.1s", label: "average transfer time" },
  { value: "0", label: "hidden monthly fees" },
  { value: "24/7", label: "account access" },
];

export default function Home() {
  return (
    <div className="bg-mist text-ink font-body">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="num text-xs font-semibold text-mint-deep tracking-widest mb-4">
              NIMBUS · DIGITAL BANKING
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-tight">
              Your money,
              <br />
              moving at the
              <br />
              <span className="text-mint-deep">speed you do.</span>
            </h1>
            <p className="mt-6 text-slate text-lg max-w-md">
              Open an account in minutes. Get a real account number, send and
              receive money instantly, and watch every transaction land in
              real time.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link
                to="/signup"
                className="bg-ink text-white font-semibold px-6 py-3.5 rounded-full hover:bg-mint-deep transition-colors"
              >
                Open free account
              </Link>
              <a href="#how" className="text-sm font-semibold text-ink underline underline-offset-4">
                See how it works
              </a>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <PhoneMock />
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section id="trust" className="bg-ink text-white py-10 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-3 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="num text-3xl sm:text-4xl font-semibold text-mint">{s.value}</p>
              <p className="text-xs sm:text-sm text-white/60 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl font-semibold max-w-lg">
            Banking that explains itself.
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 mt-12">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="bg-paper border border-line rounded-2xl p-6">
                <span className="num text-xs text-slate">0{i + 1}</span>
                <h3 className="font-display font-semibold text-lg mt-3">{f.title}</h3>
                <p className="text-slate text-sm mt-2 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-24 px-6 bg-paper border-y border-line">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl font-semibold mb-12">
            Three steps. No paperwork.
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              ["Sign up", "Create your profile and get a dedicated account number instantly."],
              ["Fund it", "Top up your wallet or receive your first transfer."],
              ["Move money", "Send to any Nimbus account number, anytime."],
            ].map(([title, body], i) => (
              <div key={title}>
                <p className="num text-mint-deep font-semibold text-sm">STEP {i + 1}</p>
                <h3 className="font-display font-semibold text-xl mt-2">{title}</h3>
                <p className="text-slate text-sm mt-2">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto bg-ink rounded-3xl px-8 py-16 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white">
            Get your account number today.
          </h2>
          <p className="text-white/60 mt-4 max-w-md mx-auto">
            Free to open. No minimum balance. No hidden fees.
          </p>
          <Link
            to="/signup"
            className="inline-block mt-8 bg-mint text-ink font-semibold px-7 py-3.5 rounded-full hover:bg-white transition-colors"
          >
            Open free account
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-10 border-t border-line">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate">
          <span className="font-display font-semibold text-ink">Nimbus</span>
          <p>Demo product for portfolio purposes — not a real financial institution.</p>
        </div>
      </footer>
    </div>
  );
}
