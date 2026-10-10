import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line py-10">
      <div className="mx-auto flex max-w-container flex-col items-start justify-between gap-6 px-5 sm:flex-row sm:items-center sm:px-6">
        <div className="space-y-2">
          <Wordmark />
          <p className="max-w-sm text-xs text-subtle">
            Supplier delivery verification and dispute resolution. Every delivery. Every discrepancy. Proven.
          </p>
        </div>
        <nav className="flex items-center gap-5 text-sm text-subtle">
          <Link href="#how" className="transition-colors hover:text-ink">
            How it works
          </Link>
          <Link href="/login" className="transition-colors hover:text-ink">
            Sign in
          </Link>
          <Link href="/signup" className="transition-colors hover:text-ink">
            Get started
          </Link>
        </nav>
      </div>
      <div className="mx-auto mt-8 max-w-container px-5 sm:px-6">
        <p className="text-xs text-subtle">© {new Date().getFullYear()} Proofline. All rights reserved.</p>
      </div>
    </footer>
  );
}
