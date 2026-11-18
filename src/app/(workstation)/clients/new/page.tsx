import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getStaff } from "@/data/queries";
import { NewClientForm } from "@/features/clients/new-client-form";

export const metadata = { title: "New client" };

export default async function NewClientPage() {
  const staff = await getStaff();
  return (
    <div className="min-h-full bg-surface">
      <header className="border-b border-line px-3 py-2.5 sm:px-4">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-xs text-ink-3"
        >
          <Link href="/clients" className="hover:text-ink">
            Clients
          </Link>
          <ChevronRight aria-hidden className="size-3" />
          <span>New</span>
        </nav>
        <h1 className="mt-0.5 text-base font-semibold">New client</h1>
      </header>
      <NewClientForm
        staff={staff.map((s) => ({ id: s.id, name: s.name, role: s.role }))}
      />
    </div>
  );
}
