import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-blue-500 rounded-full" />
          Self-Service Currency Exchange
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-5 leading-tight">
          Fast &amp; Simple<br />Foreign Currency Exchange
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
          Exchange your foreign banknotes to Korean Won instantly at our self-service kiosks — no queues, no counters.
        </p>
        <a
          href="https://ktp-exchange.channel.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
        >
          Contact Support
        </a>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-lg mb-4">
                {i + 1}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
          Common Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Support CTA */}
      <section className="max-w-5xl mx-auto px-6 py-12 text-center">
        <div className="bg-blue-600 rounded-3xl p-10 text-white">
          <h2 className="text-2xl font-bold mb-3">Need Help?</h2>
          <p className="text-blue-100 mb-6 max-w-md mx-auto">
            Our AI assistant is available 24/7 for common questions. For transaction or payment issues, contact our support team directly.
          </p>
          <a
            href="https://ktp-exchange.channel.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
          >
            Contact Support Team
          </a>
        </div>
      </section>

      <footer className="text-center text-sm text-gray-400 py-8">
        © {new Date().getFullYear()} KTP Exchange. All rights reserved.
      </footer>

      <ChatWidget />
    </main>
  );
}

const steps = [
  {
    title: "Select Language",
    description: "Choose your preferred language on the kiosk screen to get started.",
  },
  {
    title: "Scan Passport",
    description: "Place your valid passport on the scanner for identity verification.",
  },
  {
    title: "Insert Banknotes",
    description: "Insert your foreign banknotes one at a time as shown on screen.",
  },
  {
    title: "Collect KRW",
    description: "Review the exchange amount, confirm, and collect your Korean Won.",
  },
];

const faqs = [
  {
    q: "What currencies does the kiosk accept?",
    a: "Supported currencies and denominations are displayed on the kiosk screen. Generally, major foreign currencies in valid, undamaged condition are accepted.",
  },
  {
    q: "What exchange rate is applied?",
    a: "The rate is based on the representative bank-posted rate at the time of your transaction. The exact rate is shown on screen before you confirm.",
  },
  {
    q: "Why is the amount I received less than I expected?",
    a: "The final amount depends on the exchange rate at the time and rounding rules — amounts below KRW 1,000 are rounded down. For specific transaction issues, please contact support.",
  },
  {
    q: "What do I do if my banknote is rejected?",
    a: "Check that the note is not folded or damaged, is inserted correctly, and is a supported denomination. If it continues to be rejected, contact support.",
  },
];
