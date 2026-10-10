const metrics = [
  { label: "Evidence-first", caption: "Every value links to its source document." },
  { label: "Human-reviewed AI", caption: "Extraction is confirmed by your team." },
  { label: "Audit-ready", caption: "An attributable, complete case history." },
];

export function MetricsStrip() {
  return (
    <dl className="mt-10 grid grid-cols-1 gap-6 border-t border-line pt-8 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.label}>
          <dt className="text-xl font-semibold tracking-tight text-ink">{metric.label}</dt>
          <dd className="mt-1 text-sm text-subtle">{metric.caption}</dd>
        </div>
      ))}
    </dl>
  );
}
