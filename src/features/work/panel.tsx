import { Inspector } from "@/components/ui/inspector";
import { Empty } from "@/components/ui/misc";
import { getClients, getFilings, getStaff, getTasks } from "@/data/queries";
import { byCode, byId } from "@/lib/names";
import { hrefWith, type SearchParams } from "@/lib/url";
import { TaskInspector } from "./task-inspector";

/** The Work inspector for one task, as the list's default or as an explicit selection. */
export async function WorkPanel({
  id,
  sp,
  explicit,
}: {
  id: string | undefined;
  sp: SearchParams;
  explicit: boolean;
}) {
  const [tasks, clientList, staffList, filings] = await Promise.all([
    getTasks(),
    getClients(),
    getStaff(),
    getFilings(),
  ]);
  const task = id ? tasks.find((t) => t.id === id) : undefined;
  return (
    <Inspector
      label="Task"
      explicit={explicit}
      closeHref={explicit ? hrefWith("/work", sp, { sel: null }) : undefined}
    >
      {task ? (
        <TaskInspector
          task={task}
          client={byCode(clientList)[task.clientCode]}
          filing={
            task.filingId
              ? filings.find((f) => f.id === task.filingId)
              : undefined
          }
          staff={byId(staffList)}
        />
      ) : (
        <Empty title={id ? "Task not found" : "No task selected"} />
      )}
    </Inspector>
  );
}
