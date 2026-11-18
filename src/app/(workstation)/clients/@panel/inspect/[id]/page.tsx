import { PanelSlot } from "@/components/ui/panel-slot";
import { ClientsPanel } from "@/features/clients/panel";

export default function ClientsSelectionPanel({
  params,
  searchParams,
}: PageProps<"/clients/inspect/[id]">) {
  return (
    <PanelSlot label="Client" params={params} searchParams={searchParams}>
      {(id, sp) => <ClientsPanel id={id} sp={sp} explicit />}
    </PanelSlot>
  );
}
