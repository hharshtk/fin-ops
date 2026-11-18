/**
 * The list renders as `children`; an explicitly selected row renders in the `panel` slot. Row
 * clicks are intercepted into the slot, so the list is not re-rendered or re-sent.
 */
export default function BillingLayout({
  children,
  panel,
}: LayoutProps<"/billing">) {
  return (
    <div className="flex min-h-full">
      {children}
      {panel}
    </div>
  );
}
