const pillars = [
  {
    n: "01",
    title: "Verified Landlords",
    body: "Every landlord passes manual identity and title verification before their listings go live.",
  },
  {
    n: "02",
    title: "Property Code Access",
    body: "Tenants join a residence using a private property code — no cold inquiries, no misdirected messages.",
  },
  {
    n: "03",
    title: "Concierge Payments",
    body: "Paystack-secured rent and subscriptions, monthly invoicing, receipts and audit trails included.",
  },
];

export const ExperienceSection = () => {
  return (
    <section id="experience" className="w-full bg-[#0d0d0d] text-[#f5f3ee] py-24 md:py-32 px-6 md:px-12 border-t border-[#c9a84c]/10">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-14 md:mb-20">
          <span className="block text-[#c9a84c] text-[10px] uppercase tracking-[0.4em] mb-4">
            — The Experience
          </span>
          <h2 className="font-serif text-4xl md:text-5xl leading-tight">
            Managed with the <span className="italic font-light text-[#f0d78c]">care of a private office</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
          {pillars.map((p) => (
            <div key={p.n} className="border-t border-[#c9a84c]/20 pt-8">
              <div className="font-serif text-[#c9a84c] text-3xl mb-6">{p.n}</div>
              <h3 className="font-serif text-2xl mb-3">{p.title}</h3>
              <p className="text-sm text-[#f5f3ee]/60 font-light leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
