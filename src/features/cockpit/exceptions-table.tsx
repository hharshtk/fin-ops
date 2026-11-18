import { DueIn, Signal } from "@/components/ui/signal";
import { RowLink, Table, Td, Th, Tr } from "@/components/ui/table";
import type { PracticeException, StaffMember } from "@/domain/types";
import { daysBetween } from "@/lib/format";
import { firstName } from "@/lib/names";
import { TODAY } from "@/lib/today";

/** Exceptions: things that need a decision rather than a filing. Worst signal first. */
export function ExceptionsTable({
  items,
  staff,
  selected,
  hrefFor,
}: {
  items: PracticeException[];
  staff: Record<string, StaffMember>;
  selected?: string;
  hrefFor: (id: string) => string;
}) {
  return (
    <div className="scroll-thin overflow-x-auto">
      <Table label="Exceptions" rhythm={false} className="md:min-w-[34rem]">
        <thead>
          <tr>
            <Th width="2.5rem" align="center">
              <span className="sr-only">Signal</span>
            </Th>
            <Th>Exception</Th>
            <Th width="5.5rem" className="max-md:hidden">
              Client
            </Th>
            <Th width="4.5rem" className="max-md:hidden">
              Owner
            </Th>
            <Th align="right" width="4.75rem">
              Due / age
            </Th>
          </tr>
        </thead>
        <tbody>
          {items.map((x) => (
            <Tr key={x.id}>
              <Td align="center">
                <Signal aspect={x.aspect} />
              </Td>
              <Td className="w-full max-w-0">
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="shrink-0 text-xs text-ink-3">{x.kind}</span>
                  <RowLink
                    href={hrefFor(x.id)}
                    selected={x.id === selected}
                    className="truncate"
                  >
                    {x.title}
                  </RowLink>
                </div>
              </Td>
              <Td className="ident text-ink-2 max-md:hidden">{x.clientCode}</Td>
              <Td className="text-ink-2 max-md:hidden">
                {firstName(staff[x.ownerId])}
              </Td>
              <Td align="right">
                {x.due ? (
                  <DueIn due={x.due} />
                ) : (
                  <span className="text-ink-3">
                    {daysBetween(x.raised, TODAY)}d old
                  </span>
                )}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
