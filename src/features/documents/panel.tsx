import { Inspector } from "@/components/ui/inspector";
import { Empty } from "@/components/ui/misc";
import { getClients, getDocuments, getTasks } from "@/data/queries";
import { hrefWith, type SearchParams } from "@/lib/url";
import { DocInspector } from "./doc-inspector";

/** The Documents inspector for one file, as the list's default or as an explicit selection. */
export async function DocumentsPanel({
  id,
  sp,
  explicit,
}: {
  id: string | undefined;
  sp: SearchParams;
  explicit: boolean;
}) {
  const [docs, clients, tasks] = await Promise.all([
    getDocuments(),
    getClients(),
    getTasks(),
  ]);
  const doc = id ? docs.find((d) => d.id === id) : undefined;
  return (
    <Inspector
      label="Document"
      explicit={explicit}
      closeHref={
        explicit ? hrefWith("/documents", sp, { sel: null }) : undefined
      }
    >
      {doc ? (
        <DocInspector doc={doc} clients={clients} tasks={tasks} />
      ) : (
        <Empty title={id ? "Document not found" : "Nothing selected"} />
      )}
    </Inspector>
  );
}
