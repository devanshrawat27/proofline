import { Boxes, Factory, Truck, Warehouse } from "lucide-react";

const audiences = [
  { icon: Truck, label: "Distributors" },
  { icon: Boxes, label: "Wholesalers" },
  { icon: Factory, label: "Manufacturers" },
  { icon: Warehouse, label: "Procurement teams" },
];

export function TrustStrip() {
  return (
    <section aria-label="Who Proofline is for" className="border-y border-line bg-app/60">
      <div className="mx-auto max-w-container px-5 py-8 sm:px-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-subtle">
          Made for the teams that move goods
        </p>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {audiences.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-sm font-medium text-subtle">
              <item.icon className="h-4 w-4 text-brand" aria-hidden />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
