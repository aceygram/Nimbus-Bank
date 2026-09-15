import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import DashboardPreview from "../components/DashboardPreview";
import logoImgInv from '../assets/Nimbus-Bank-Inverse.png';

const FEATURES = [
  {
    title: "Unified Account Overview",
    body: "Aggregate checking, savings, and every account you hold into one elegant dashboard with live, real-time updates.",
    points: ["Real-time transaction history", "Automatic merchant categorization"],
    size: "large",
  },
  {
    title: "Bank-grade Security",
    body: "Your data is encrypted end-to-end and protected by multi-factor authentication at every step.",
    size: "small",
  },
  {
    title: "Budget Tracking",
    body: "Set monthly limits by category and get alerts before you overspend.",
    size: "dark",
  },
  {
    title: "Transfers & Payments",
    body: "Effortless peer-to-peer transfers — send money to anyone with zero fees, in seconds.",
    size: "wide",
  },
];

const PLANS = [
  { name: "Starter", price: "$0", tagline: "Perfect for getting up and running.", features: ["Real-time balances", "Categorized spending", "Basic budget tracking"], dark: false },
  { name: "Plus", price: "$8", tagline: "For people who want more control.", features: ["Everything in Starter", "Advanced budget tracking", "Bill payment scheduling"], dark: true, popular: true },
  { name: "Premier", price: "$18", tagline: "Built for power users and planners.", features: ["Everything in Plus", "Multi-account sync", "Priority support"], dark: false },
];

export default function Home() {
  return (
    <div className="text-ink font-body">
      <Navbar />

      {/* HERO */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="num inline-block bg-muted-2 text-slate text-xs font-medium tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
            Trusted by 250K+ daily users
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
            One Place for Every Part of Your{" "}
            <span className="text-link font-normal">Financial Life</span>
          </h1>
          <p className="mt-5 text-slate text-lg max-w-xl mx-auto">
            Real-time balances, categorized spending, and effortless transfers —
            everything you need to see exactly where your money goes.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/signup"
              className="bg-mint text-ink font-bold px-5 py-3.5 rounded-xl hover:bg-mint-deep transition-colors shadow-lg shadow-mint/20"
            >
              Sign Up for Free
            </Link>
            <a
              href="#features"
              className="bg-paper border border-line text-ink font-bold px-5 py-3.5 rounded-xl hover:border-slate transition-colors"
            >
              See How It Works
            </a>
          </div>
        </div>

        <div className="mt-16 px-2">
          <DashboardPreview />
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="bg-muted py-10 px-6">
        <p className="num text-center text-xs text-slate tracking-widest uppercase mb-6">
          Used by the world's leading companies
        </p>
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 opacity-50 max-w-4xl mx-auto">
          {["BoltShift", "CloudWatch", "Coalesce", "Alt+Shift", "Biosynthesia"].map((name) => (
            <span key={name} className="font-bold text-lg text-ink">{name}</span>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="num inline-block bg-blue/10 text-blue text-sm tracking-widest uppercase px-4 py-1 rounded-full mb-4">
              Features
            </span>
            <h2 className="font-display text-3xl font-semibold">Smarter Everyday Banking, All In One Place</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`rounded-3xl p-7 ${
                  f.size === "large" ? "sm:col-span-2 sm:row-span-1" : ""
                } ${f.size === "wide" ? "sm:col-span-2" : ""} ${
                  f.size === "dark" ? "bg-ink text-white" : "bg-paper border border-line"
                }`}
              >
                <h3 className={`font-display font-semibold text-lg mb-2 ${f.size === "dark" ? "text-white" : "text-ink"}`}>
                  {f.title}
                </h3>
                <p className={`text-sm mb-3 ${f.size === "dark" ? "text-white/70" : "text-slate"}`}>{f.body}</p>
                {f.points && (
                  <ul className="space-y-1.5 mt-3">
                    {f.points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-sm font-medium text-ink">
                        <span className="w-1.5 h-1.5 rounded-full bg-mint" /> {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="trust" className="bg-ink py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="num text-mint text-sm tracking-widest uppercase">Testimonials</span>
          <h2 className="font-display text-3xl font-semibold text-white mt-2 mb-10">Real people, real results</h2>
          <div className="grid sm:grid-cols-3 gap-5 text-left">
            {[
              { quote: "Everything I need is right there — balances, transfers, budgets — without digging through menus.", name: "Alex Morrison", role: "Graphic Designer" },
              { quote: "The security features gave me peace of mind from day one. It feels like a partner, not just a bank.", name: "Michael Chen", role: "Business Owner" },
              { quote: "Finally, an app that treats me like an adult. I've saved nearly 20% more since switching.", name: "Jordan Lee", role: "Data Scientist" },
            ].map((t) => (
              <div key={t.name} className="bg-white/5 border border-white/10 rounded-3xl p-7">
                <p className="text-white/80 italic text-sm leading-relaxed mb-5">"{t.quote}"</p>
                <p className="font-bold text-white text-sm">{t.name}</p>
                <p className="num text-white/50 text-xs">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section id="how" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="num text-link text-sm tracking-widest uppercase">Plans</span>
            <h2 className="font-display text-3xl font-semibold mt-2">Simple plans for every kind of banker</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl p-8 ${
                  plan.dark ? "bg-ink text-white" : "bg-paper border border-line"
                }`}
              >
                {plan.popular && (
                  <span className="absolute top-6 right-6 bg-mint text-ink text-xs font-bold px-3 py-1 rounded-full">
                    Popular
                  </span>
                )}
                <h3 className="font-display font-semibold text-xl mb-1">{plan.name}</h3>
                <p className={`text-xs mb-6 ${plan.dark ? "text-white/60" : "text-slate"}`}>{plan.tagline}</p>
                <p className="font-display text-4xl font-bold mb-6 tracking-tight">
                  {plan.price}
                  <span className={`text-base font-normal ${plan.dark ? "text-white/60" : "text-slate"}`}> / month</span>
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-mint shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
                    plan.dark
                      ? "bg-mint text-ink hover:bg-mint-deep"
                      : "border border-line text-ink hover:border-slate"
                  }`}
                >
                  Start Free Trial
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto bg-blue rounded-[32px] px-8 py-14 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Open your smarter bank account today
          </h2>
          <p className="text-white/90 mt-3 max-w-md mx-auto">
            Sign up in a few taps and start your journey with real-time insights and effortless transfers.
          </p>
          <Link
            to="/signup"
            className="inline-block mt-7 bg-white text-blue font-bold px-8 py-3.5 rounded-xl hover:bg-mist transition-colors"
          >
            Get Started in Minutes
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-ink px-6 py-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between gap-6">
          <div>
            <img src={logoImgInv} alt="Nimbus Bank Logo" className="w-25 h-auto block mx-auto" />
          </div>
          <div className="flex justify-center gap-8 num text-sm text-white/60">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
          </div>
        </div>
        <p className="num flex justify-center text-white/40 text-xs mt-8 max-w-5xl mx-auto">© 2024 Nimbus Bank.</p>
      </footer>
    </div>
  );
}
