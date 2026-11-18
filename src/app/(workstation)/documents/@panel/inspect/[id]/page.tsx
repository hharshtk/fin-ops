import { PanelSlot } from "@/components/ui/panel-slot";
import { DocumentsPanel } from "@/features/documents/panel";

export default function DocumentsSelectionPanel({
  params,
  searchParams,
}: PageProps<"/documents/inspect/[id]">) {
  return (
    <PanelSlot label="Document" params={params} searchParams={searchParams}>
      {(id, sp) => <DocumentsPanel id={id} sp={sp} explicit />}
    </PanelSlot>
  );
}
