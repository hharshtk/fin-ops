import { DueIn, Signal } from "@/components/ui/signal";
import { Status } from "@/components/ui/status";
import { RowLink, Table, Td, Th, Tr } from "@/components/ui/table";
import type { Client, Filing, StaffMember } from "@/domain/types";
import { cn } from "@/lib/cn";
import { dayMonth, weekday } from "@/lib/format";
import { shortName } from "@/lib/names";
import { aspectFor } from "@/lib/signal";
import { TODAY } from "@/lib/today";

/** Filings register: one row per client filing, grouped by due date. */
export function Register({
  filings,
  clients,
  staff,
  selected,
  hrefFor,
  showClient = true,
}: {
  filings: Filing[];
  clients: Record<string, Client>;
  staff: Record<string, StaffMember>;
  selected?: string;
  hrefFor: (id: string) => string;
  showClient?: boolean;
}) {
  const groups = new Map<string, Filing[]>();
  for (const f of filings) groups.set(f.due, [...(groups.get(f.due) ?? []), f]);

  return (
    <div className="scroll-thin overflow-x-auto">
      <Table
        label="Filings register"
        className={showClient ? "md:min-w-[52rem]" : "md:min-w-[40rem]"}
      >
        <thead>
          <tr>
            <Th width="2.5rem" align="center">
              <span className="sr-only">Signal</span>
            </Th>
            <Th width="5.5rem" className="max-md:hidden">
              Due
            </Th>
            {showClient && <Th>Client</Th>}
            <Th width="7.5rem">Form</Th>
            <Th width="7.5rem" className="max-md:hidden">
              Period
            </Th>
            <Th width="7.5rem">Status</Th>
            <Th width="4.75rem" align="right" className="max-md:hidden">
              Late / due
            </Th>
            <Th width="5.5rem" className="max-md:hidden">
              Assignee
            </Th>
            <Th
              width={showClient ? "12rem" : undefined}
              className={showClient ? "max-2xl:hidden" : "max-md:hidden"}
            >
              Filed · acknowledgement
            </Th>
          </tr>
        </thead>
        {[...groups.entries()].map(([due, rows]) => (
          <tbody key={due}>
            {rows.map((f, i) => {
              const c = clients[f.clientCode];
              const done = f.status === "Filed";
              return (
                <Tr key={f.id}>
                  <Td align="center">
                    <Signal aspect={aspectFor(f.due, done)} />
                  </Td>
                  <Td className="max-md:hidden">
                    {i === 0 && (
                      <span className="flex items-baseline gap-1.5">
                        <span
                          className={cn(
                            "text-base font-bold condensed tabular-nums",
                            due < TODAY &&
                              rows.some((r) => r.status !== "Filed")
                              ? "text-sig-red-ink"
                              : "text-ink",
                          )}
                        >
                          {dayMonth(due)}
                        </span>
                        <span className="text-xs text-ink-3">
                          {weekday(due)}
                        </span>
                      </span>
                    )}
                  </Td>
                  {showClient && (
                    <Td className="w-full max-w-0">
                      <div className="flex min-w-0 items-baseline gap-2">
                        <span className="w-[4.25rem] shrink-0 text-xs ident text-ink-3 max-sm:hidden">
                          {f.clientCode}
                        </span>
                        <RowLink
                          href={hrefFor(f.id)}
                          selected={f.id === selected}
                          className="truncate"
                        >
                          {c ? shortName(c.name) : f.clientCode}
                        </RowLink>
                      </div>
                    </Td>
                  )}
                  <Td className="font-medium">
                    {showClient ? (
                      f.form
                    ) : (
                      <RowLink
                        href={hrefFor(f.id)}
                        selected={f.id === selected}
                      >
                        {f.form}
                      </RowLink>
                    )}
                  </Td>
                  <Td className="text-ink-2 max-md:hidden">{f.period}</Td>
                  <Td>
                    <Status kind="filing" value={f.status} />
                  </Td>
                  <Td align="right" className="max-md:hidden">
                    <DueIn due={f.due} done={done} />
                  </Td>
                  <Td className="text-ink-2 max-md:hidden">
                    {staff[f.assigneeId]?.name.split(" ")[0]}
                  </Td>
                  <Td
                    className={
                      showClient
                        ? "max-w-[12rem] truncate text-xs ident text-ink-3 max-2xl:hidden"
                        : "truncate text-xs ident text-ink-3 max-md:hidden"
                    }
                  >
                    {done
                      ? `${f.filedOn ? dayMonth(f.filedOn) : ""} · ${f.ackNo ?? ""}`
                      : f.remindersSent > 0
                        ? `${f.remindersSent} reminder${f.remindersSent > 1 ? "s" : ""} sent`
                        : ""}
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
