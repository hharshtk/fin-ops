import { PanelSlot } from "@/components/ui/panel-slot";
import { CompliancePanel } from "@/features/compliance/panel";

export default function FilingPanel({
  params,
  searchParams,
}: PageProps<"/compliance/inspect/[id]">) {
  return (
    <PanelSlot label="Filing" params={params} searchParams={searchParams}>
      {(id, sp) => <CompliancePanel id={id} sp={sp} explicit />}
    </PanelSlot>
  );
}
