import { Inspector } from "@/components/ui/inspector";
import { Empty } from "@/components/ui/misc";
import {
  filingsInBatch,
  getClients,
  getCurrentUser,
  getExceptions,
  getFilings,
  getStaff,
  getTasks,
  groupBatches,
} from "@/data/queries";
import { byCode, byId } from "@/lib/names";
import { hrefWith, type SearchParams } from "@/lib/url";
import { BatchInspector, ExceptionInspector } from "./inspectors";
import { scopeFilings, scopeOf } from "./scope";

/**
 * The Cockpit inspector: a Due Board batch (ids start `b-`) or an exception (`x-`), as the
 * default or as an explicit selection.
 */
export async function CockpitPanel({
  id,
  sp,
  explicit,
}: {
  id: string | undefined;
  sp: SearchParams;
  explicit: boolean;
}) {
  const [filings, exceptions, tasks, staffList, clientList, me] =
    await Promise.all([
      getFilings(),
      getExceptions(),
      getTasks(),
      getStaff(),
      getClients(),
      getCurrentUser(),
    ]);
  const staff = byId(staffList);
  const clients = byCode(clientList);
  const scoped = scopeFilings(filings, clients, me.id, scopeOf(sp));
  const batch = id ? groupBatches(scoped).find((b) => b.key === id) : undefined;
  const exception =
    id && !batch ? exceptions.find((x) => x.id === id) : undefined;

  return (
    <Inspector
      label="Inspector"
      explicit={explicit}
      closeHref={explicit ? hrefWith("/", sp, { sel: null }) : undefined}
    >
      {batch ? (
        <BatchInspector
          batch={batch}
          tasks={tasks}
          filings={filingsInBatch(scoped, batch)}
          clients={clients}
          staff={staff}
        />
      ) : exception ? (
        <ExceptionInspector
          item={exception}
          client={clients[exception.clientCode]}
          owner={staff[exception.ownerId]}
        />
      ) : (
        <Empty title="Select a row to inspect it">
          Pick a batch on the Due Board or an exception to see who it is waiting
          on and act on it here.
        </Empty>
      )}
    </Inspector>
  );
}
