import { PanelSlot } from "@/components/ui/panel-slot";
import { CockpitPanel } from "@/features/cockpit/panel";

export default function CockpitSelectionPanel({
  params,
  searchParams,
}: PageProps<"/inspect/[id]">) {
  return (
    <PanelSlot label="Inspector" params={params} searchParams={searchParams}>
      {(id, sp) => <CockpitPanel id={id} sp={sp} explicit />}
    </PanelSlot>
  );
}
