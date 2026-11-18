import { PanelSlot } from "@/components/ui/panel-slot";
import { BooksPanel } from "@/features/books/panel";

export default function BooksSelectionPanel({
  params,
  searchParams,
}: PageProps<"/books/inspect/[id]">) {
  return (
    <PanelSlot label="Voucher" params={params} searchParams={searchParams}>
      {(id, sp) => <BooksPanel id={id} sp={sp} explicit />}
    </PanelSlot>
  );
}
