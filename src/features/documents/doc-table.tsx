import { Status } from "@/components/ui/status";
import { RowLink, Table, Td, Th, Tr } from "@/components/ui/table";
import type { DocumentItem } from "@/domain/types";
import { dayMonth, time } from "@/lib/format";
import { TODAY } from "@/lib/today";
import { SOURCE_ICON } from "../cockpit/strip";

function size(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

export function DocTable({
  docs,
  selected,
  hrefFor,
  showClient = true,
}: {
  docs: DocumentItem[];
  selected?: string;
  hrefFor: (id: string) => string;
  showClient?: boolean;
}) {
  return (
    <div className="scroll-thin overflow-x-auto">
      <Table label="Documents" className="min-w-[48rem]">
        <thead>
          <tr>
            <Th width="2.25rem" align="center">
              <span className="sr-only">Source</span>
            </Th>
            <Th>Document</Th>
            {showClient && <Th width="5.5rem">Client</Th>}
            <Th width="10rem">Type</Th>
            <Th width="7rem">Period</Th>
            <Th width="5.5rem" align="right" className="max-2xl:hidden">
              Size
            </Th>
            <Th width="6rem" align="right">
              Received
            </Th>
            <Th width="7.5rem">Status</Th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => {
            const Icon = SOURCE_ICON[d.source];
            const today = d.receivedAt.slice(0, 10) === TODAY;
            return (
              <Tr key={d.id}>
                <Td align="center">
                  <Icon
                    aria-label={d.source}
                    className="mx-auto size-3.5 text-ink-3"
                    strokeWidth={2}
                  />
                </Td>
                <Td className="w-full max-w-0">
                  <RowLink
                    href={hrefFor(d.id)}
                    selected={d.id === selected}
                    className="block truncate"
                  >
                    {d.name}
                  </RowLink>
                </Td>
                {showClient && (
                  <Td className="ident text-ink-2">
                    {d.clientCode ?? (
                      <span className="text-sig-yellow-ink">Unknown</span>
                    )}
                  </Td>
                )}
                <Td className="text-ink-2">{d.kind}</Td>
                <Td className="text-ink-2">
                  {d.period ?? <span className="text-ink-4">—</span>}
                </Td>
                <Td align="right" className="text-ink-3 max-2xl:hidden">
                  {size(d.sizeKb)}
                </Td>
                <Td align="right" className="text-ink-2">
                  {today
                    ? `Today ${time(d.receivedAt)}`
                    : dayMonth(d.receivedAt)}
                </Td>
                <Td>
                  <Status kind="document" value={d.status} />
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
