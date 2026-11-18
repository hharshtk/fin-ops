import { Inspector } from "@/components/ui/inspector";
import { Empty } from "@/components/ui/misc";
import { getBooks, getBooksClients } from "@/data/queries";
import { hrefWith, param, type SearchParams } from "@/lib/url";
import { BankLineInspector, VoucherInspector } from "./books-inspectors";

/**
 * The Books inspector: a voucher from the day book or a line from the bank statement, as the
 * list's default or as an explicit selection.
 */
export async function BooksPanel({
  id,
  sp,
  explicit,
}: {
  id: string | undefined;
  sp: SearchParams;
  explicit: boolean;
}) {
  const available = await getBooksClients();
  const books = await getBooks(param(sp, "client") ?? available[0]!);
  const voucher = id ? books?.vouchers.find((v) => v.id === id) : undefined;
  const line =
    id && !voucher ? books?.bankLines.find((b) => b.id === id) : undefined;
  return (
    <Inspector
      label={line ? "Bank line" : "Voucher"}
      explicit={explicit}
      closeHref={explicit ? hrefWith("/books", sp, { sel: null }) : undefined}
    >
      {voucher ? (
        <VoucherInspector voucher={voucher} />
      ) : line ? (
        <BankLineInspector
          line={line}
          voucher={books?.vouchers.find((v) => v.number === line.voucherNo)}
        />
      ) : (
        <Empty title="Nothing selected" />
      )}
    </Inspector>
  );
}
