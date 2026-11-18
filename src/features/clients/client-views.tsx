import { Signal } from "@/components/ui/signal";
import { RowLink, Table, Td, Th, Tr } from "@/components/ui/table";
import type { Aspect, Client, StaffMember } from "@/domain/types";
import { dayMonth, inrShort } from "@/lib/format";
import { shortName } from "@/lib/names";

export interface ClientRow {
  client: Client;
  aspect: Aspect;
  open: number;
  overdue: number;
  outstanding: number;
}

export function ClientTable({
  rows,
  staff,
  selected,
  hrefFor,
}: {
  rows: ClientRow[];
  staff: Record<string, StaffMember>;
  selected?: string;
  hrefFor: (code: string) => string;
}) {
  return (
    <div className="scroll-thin overflow-x-auto">
      <Table label="Clients" className="min-w-[52rem]">
        <thead>
          <tr>
            <Th width="2.5rem" align="center">
              <span className="sr-only">Signal</span>
            </Th>
            <Th width="5.25rem">Code</Th>
            <Th>Client</Th>
            <Th width="7.5rem" className="max-2xl:hidden">
              Constitution
            </Th>
            <Th width="6.75rem">PAN</Th>
            <Th width="10.5rem" className="max-2xl:hidden">
              GSTIN
            </Th>
            <Th width="6.25rem">GST</Th>
            <Th width="5rem">Partner</Th>
            <Th width="4rem" align="right">
              Open
            </Th>
            <Th width="5rem" align="right">
              Overdue
            </Th>
            <Th width="6.5rem" align="right">
              Fees due
            </Th>
            <Th width="6rem" align="right" className="max-2xl:hidden">
              Last contact
            </Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ client: c, aspect, open, overdue, outstanding }) => (
            <Tr key={c.code}>
              <Td align="center">
                <Signal aspect={aspect} />
              </Td>
              <Td className="ident text-ink-2">{c.code}</Td>
              <Td className="w-full max-w-0">
                <div className="flex min-w-0 items-baseline gap-2">
                  <RowLink
                    href={hrefFor(c.code)}
                    selected={c.code === selected}
                    className="truncate font-medium"
                  >
                    {c.name}
                  </RowLink>
                  <span className="truncate text-xs text-ink-3 max-2xl:hidden">
                    {c.city}
                  </span>
                </div>
              </Td>
              <Td className="text-ink-2 max-2xl:hidden">{c.constitution}</Td>
              <Td className="ident">{c.pan}</Td>
              <Td className="ident text-ink-2 max-2xl:hidden">
                {c.gstin ?? <span className="text-ink-4">—</span>}
              </Td>
              <Td className="text-ink-2">
                {c.gstScheme === "Unregistered" ? (
                  <span className="text-ink-4">—</span>
                ) : (
                  c.gstScheme
                )}
              </Td>
              <Td className="text-ink-2">{staff[c.partnerId]?.initials}</Td>
              <Td align="right">
                {open || <span className="text-ink-4">·</span>}
              </Td>
              <Td align="right">
                {overdue ? (
                  <span className="font-semibold text-sig-red-ink">
                    {overdue}
                  </span>
                ) : (
                  <span className="text-ink-4">·</span>
                )}
              </Td>
              <Td align="right">
                {outstanding ? (
                  inrShort(outstanding)
                ) : (
                  <span className="text-ink-4">·</span>
                )}
              </Td>
              <Td align="right" className="text-ink-2 max-2xl:hidden">
                {dayMonth(c.lastContact)}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

/**
 * The client book: every client as a coded cell, so a partner can scan the whole practice in one
 * view. Cells sort worst signal first within each partner.
 */
export function ClientBook({
  groups,
  selected,
  hrefFor,
}: {
  groups: { title: string; rows: ClientRow[] }[];
  selected?: string;
  hrefFor: (code: string) => string;
}) {
  return (
    <div className="flex flex-col gap-px bg-line">
      {groups.map((g) => (
        <section key={g.title} className="bg-surface">
          <h2 className="flex h-8 items-center gap-2 border-b border-line px-3 caps text-ink-3 sm:px-4">
            {g.title}
            <span className="font-normal normal-case figures">
              {g.rows.length}
            </span>
          </h2>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(11.5rem,1fr))]">
            {g.rows.map(({ client: c, aspect, open, overdue }) => (
              <li key={c.code} className="border-r border-b border-line">
                <RowLink
                  href={hrefFor(c.code)}
                  stretch={false}
                  selected={c.code === selected}
                  className="flex h-[3.25rem] flex-col justify-center gap-0.5 px-3 transition-colors duration-150 hover:bg-hover focus:bg-select focus:outline-none"
                >
                  <span className="flex items-center gap-2">
                    <Signal aspect={aspect} />
                    <span className="text-xs font-semibold ident text-ink">
                      {c.code}
                    </span>
                    <span className="ml-auto text-xs text-ink-3 figures">
                      {overdue > 0 ? (
                        <span className="font-semibold text-sig-red-ink">
                          {overdue} late
                        </span>
                      ) : open > 0 ? (
                        `${open} open`
                      ) : (
                        "clear"
                      )}
                    </span>
                  </span>
                  <span className="truncate text-sm text-ink-2">
                    {shortName(c.name)}
                  </span>
                </RowLink>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
