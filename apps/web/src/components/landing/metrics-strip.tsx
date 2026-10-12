const metrics = [
  { label: "Evidence-first", caption: "Every value links to its source document." },
  { label: "Human-reviewed AI", caption: "AI extraction is confirmed by your team." },
  { label: "Audit-ready", caption: "An attributable, complete case history." },
];

export function MetricsStrip() {
  return (
    <div className="mt-10 border-t border-line pt-7">
      <dl className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <dt className="whitespace-nowrap text-base font-semibold tracking-tight text-ink">
              {metric.label}
            </dt>
            <dd className="mt-1.5 text-[13px] leading-relaxed text-subtle sm:text-sm">
              {metric.caption}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
