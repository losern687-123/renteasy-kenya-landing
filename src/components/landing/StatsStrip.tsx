export const StatsStrip = () => {
  const stats = [
    { value: "KES 1.2B+", label: "Rent Processed" },
    { value: "850+", label: "Verified Properties" },
    { value: "12", label: "Nairobi Districts" },
  ];
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 py-14 md:py-16 bg-[#1a1a1a] border-y border-[#c9a84c]/10">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`flex flex-col items-center px-6 py-6 md:py-0 ${
            i < stats.length - 1 ? "md:border-r border-[#c9a84c]/10" : ""
          }`}
        >
          <span className="text-4xl md:text-5xl font-serif font-light text-[#c9a84c] mb-2">
            {s.value}
          </span>
          <span className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-[#f5f3ee]/50">
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
};
