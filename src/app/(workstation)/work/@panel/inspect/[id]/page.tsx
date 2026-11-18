import { PanelSlot } from "@/components/ui/panel-slot";
import { WorkPanel } from "@/features/work/panel";

export default function WorkSelectionPanel({
  params,
  searchParams,
}: PageProps<"/work/inspect/[id]">) {
  return (
    <PanelSlot label="Task" params={params} searchParams={searchParams}>
      {(id, sp) => <WorkPanel id={id} sp={sp} explicit />}
    </PanelSlot>
  );
}
