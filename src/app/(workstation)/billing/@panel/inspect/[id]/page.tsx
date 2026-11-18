import { PanelSlot } from "@/components/ui/panel-slot";
import { BillingPanel } from "@/features/billing/panel";

export default function BillingSelectionPanel({
  params,
  searchParams,
}: PageProps<"/billing/inspect/[id]">) {
  return (
    <PanelSlot label="Invoice" params={params} searchParams={searchParams}>
      {(id, sp) => <BillingPanel id={id} sp={sp} explicit />}
    </PanelSlot>
  );
}
