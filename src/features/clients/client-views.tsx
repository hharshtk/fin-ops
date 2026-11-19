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
    // Columns drop by the table's own width (a container query), not the viewport's, because the
    // rail and inspector take different shares at each breakpoint. The client name is never the
    // column that gives way.
    <div className="@container scroll-thin overflow-x-auto">
      <Table label="Clients">
        <thead>
          <tr>
            <Th width="2.5rem" align="center">
              <span className="sr-only">Signal</span>
            </Th>
            <Th width="5.25rem" className="@max-[26rem]:hidden">
              Code
            </Th>
            <Th>Client</Th>
            <Th width="7.5rem" className="@max-[70rem]:hidden">
              Constitution
            </Th>
            <Th width="6.75rem" className="@max-[56rem]:hidden">
              PAN
            </Th>
            <Th width="10.5rem" className="@max-[80rem]:hidden">
              GSTIN
            </Th>
            <Th width="6.25rem" className="@max-[56rem]:hidden">
              GST
            </Th>
            <Th width="5rem" className="@max-[56rem]:hidden">
              Partner
            </Th>
            <Th width="4rem" align="right" className="@max-[40rem]:hidden">
              Open
            </Th>
            <Th width="5rem" align="right" className="@max-[40rem]:hidden">
              Overdue
            </Th>
            <Th width="6.5rem" align="right" className="@max-[40rem]:hidden">
              Fees due
            </Th>
            <Th width="6rem" align="right" className="@max-[70rem]:hidden">
              Last contact
            </Th>
            <Th width="4.5rem" align="right" className="@min-[40rem]:hidden">
              State
            </Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ client: c, aspect, open, overdue, outstanding }) => (
            <Tr key={c.code}>
              <Td align="center">
                <Signal aspect={aspect} />
              </Td>
              <Td className="ident text-ink-2 @max-[26rem]:hidden">{c.code}</Td>
              <Td className="w-full max-w-0">
                <div className="flex min-w-0 items-baseline gap-2">
                  <RowLink
                    href={hrefFor(c.code)}
                    selected={c.code === selected}
                    className="truncate font-medium"
                  >
                    {c.name}
                  </RowLink>
                  <span className="truncate text-xs text-ink-3 @max-[70rem]:hidden">
                    {c.city}
                  </span>
                </div>
              </Td>
              <Td className="text-ink-2 @max-[70rem]:hidden">
                {c.constitution}
              </Td>
              <Td className="ident @max-[56rem]:hidden">{c.pan}</Td>
              <Td className="ident text-ink-2 @max-[80rem]:hidden">
                {c.gstin ?? <span className="text-ink-4">—</span>}
              </Td>
              <Td className="text-ink-2 @max-[56rem]:hidden">
                {c.gstScheme === "Unregistered" ? (
                  <span className="text-ink-4">—</span>
                ) : (
                  c.gstScheme
                )}
              </Td>
              <Td className="text-ink-2 @max-[56rem]:hidden">
                {staff[c.partnerId]?.initials}
              </Td>
              <Td align="right" className="@max-[40rem]:hidden">
                {open || <span className="text-ink-4">·</span>}
              </Td>
              <Td align="right" className="@max-[40rem]:hidden">
                {overdue ? (
                  <span className="font-semibold text-sig-red-ink">
                    {overdue}
                  </span>
                ) : (
                  <span className="text-ink-4">·</span>
                )}
              </Td>
              <Td align="right" className="@max-[40rem]:hidden">
                {outstanding ? (
                  inrShort(outstanding)
                ) : (
                  <span className="text-ink-4">·</span>
                )}
              </Td>
              <Td align="right" className="text-ink-2 @max-[70rem]:hidden">
                {dayMonth(c.lastContact)}
              </Td>
              <Td align="right" className="@min-[40rem]:hidden">
                {overdue > 0 ? (
                  <span className="font-semibold text-sig-red-ink">
                    {overdue} late
                  </span>
                ) : open > 0 ? (
                  <span className="text-ink-2">{open} open</span>
                ) : (
                  <span className="text-ink-3">clear</span>
                )}
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
