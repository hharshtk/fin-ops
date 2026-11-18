import { PanelSlot } from "@/components/ui/panel-slot";
import { TeamPanel } from "@/features/team/panel";

export default function TeamSelectionPanel({
  params,
  searchParams,
}: PageProps<"/team/inspect/[id]">) {
  return (
    <PanelSlot label="Person" params={params} searchParams={searchParams}>
      {(id, sp) => <TeamPanel id={id} sp={sp} explicit />}
    </PanelSlot>
  );
}
