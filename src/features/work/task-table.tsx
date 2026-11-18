import { DueIn, Signal } from "@/components/ui/signal";
import { Status } from "@/components/ui/status";
import { RowLink, Table, Td, Th, Tr } from "@/components/ui/table";
import type { Client, StaffMember, Task } from "@/domain/types";
import { cn } from "@/lib/cn";
import { shortName } from "@/lib/names";
import { aspectFor } from "@/lib/signal";

export function TaskTable({
  groups,
  clients,
  staff,
  selected,
  hrefFor,
}: {
  groups: { title: string; tasks: Task[] }[];
  clients: Record<string, Client>;
  staff: Record<string, StaffMember>;
  selected?: string;
  hrefFor: (id: string) => string;
}) {
  return (
    <div className="scroll-thin overflow-x-auto">
      <Table label="Tasks" className="md:min-w-[52rem]">
        <thead>
          <tr>
            <Th width="2.5rem" align="center">
              <span className="sr-only">Signal</span>
            </Th>
            <Th>Task</Th>
            <Th width="10.5rem" className="max-md:hidden">
              Client
            </Th>
            <Th width="5.75rem" className="max-md:hidden">
              Type
            </Th>
            <Th width="5rem" className="max-md:hidden">
              Assignee
            </Th>
            <Th width="5rem" className="max-2xl:hidden">
              Reviewer
            </Th>
            <Th width="4.75rem" align="right">
              Due
            </Th>
            <Th width="4rem" align="right" className="max-md:hidden">
              Hours
            </Th>
            <Th width="8.5rem">Status</Th>
          </tr>
        </thead>
        {groups.map((g) => (
          <tbody key={g.title}>
            <tr>
              <th
                scope="rowgroup"
                colSpan={9}
                className="h-7 border-b border-line bg-surface px-3 text-left"
              >
                <span className="caps text-ink-2">{g.title}</span>
                <span className="ml-2 text-xs text-ink-3 figures">
                  {g.tasks.length}
                </span>
              </th>
            </tr>
            {g.tasks.map((t) => {
              const done = t.status === "Done";
              const over = t.loggedHours > t.estimateHours;
              return (
                <Tr key={t.id}>
                  <Td align="center">
                    <Signal aspect={aspectFor(t.due, done)} />
                  </Td>
                  <Td className="w-full max-w-0">
                    <RowLink
                      href={hrefFor(t.id)}
                      selected={t.id === selected}
                      className={cn("block truncate", done && "text-ink-3")}
                    >
                      {t.title}
                    </RowLink>
                  </Td>
                  <Td className="max-w-[10.5rem] truncate max-md:hidden">
                    <span className="mr-2 text-xs ident text-ink-3">
                      {t.clientCode}
                    </span>
                    <span className="text-ink-2">
                      {clients[t.clientCode]
                        ? shortName(clients[t.clientCode]!.name)
                        : ""}
                    </span>
                  </Td>
                  <Td className="text-ink-2 max-md:hidden">{t.type}</Td>
                  <Td className="text-ink-2 max-md:hidden">
                    {staff[t.assigneeId]?.name.split(" ")[0]}
                  </Td>
                  <Td className="text-ink-2 max-2xl:hidden">
                    {staff[t.reviewerId]?.name.split(" ")[0]}
                  </Td>
                  <Td align="right">
                    <DueIn due={t.due} done={done} />
                  </Td>
                  <Td
                    align="right"
                    className={cn(
                      over ? "text-sig-red-ink" : "text-ink-2",
                      "max-md:hidden",
                    )}
                  >
                    {t.loggedHours}/{t.estimateHours}
                  </Td>
                  <Td>
                    <Status kind="task" value={t.status} />
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        ))}
      </Table>
    </div>
  );
}
