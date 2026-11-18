import { Inspector } from "@/components/ui/inspector";
import { Empty } from "@/components/ui/misc";
import {
  filingActivity,
  getClients,
  getFilings,
  getStaff,
} from "@/data/queries";
import { date } from "@/lib/format";
import { byCode, byId } from "@/lib/names";
import { TODAY } from "@/lib/today";
import { hrefWith, type SearchParams } from "@/lib/url";
import { FilingInspector } from "./filing-inspector";

/** The Compliance inspector for one filing, as the list's default or as an explicit selection. */
export async function CompliancePanel({
  id,
  sp,
  explicit,
}: {
  id: string | undefined;
  sp: SearchParams;
  explicit: boolean;
}) {
  const [filings, clientList, staffList] = await Promise.all([
    getFilings(),
    getClients(),
    getStaff(),
  ]);
  const staff = byId(staffList);
  const filing = id ? filings.find((f) => f.id === id) : undefined;
  return (
    <Inspector
      label="Filing"
      explicit={explicit}
      closeHref={
        explicit ? hrefWith("/compliance", sp, { sel: null }) : undefined
      }
    >
      {filing ? (
        <FilingInspector
          filing={filing}
          client={byCode(clientList)[filing.clientCode]}
          staff={staff}
          activity={filingActivity(filing, staff)}
          today={date(TODAY)}
        />
      ) : (
        <Empty title={id ? "Filing not found" : "No filing selected"}>
          Pick a row to see its status, who it is waiting on, and record the
          acknowledgement once filed.
        </Empty>
      )}
    </Inspector>
  );
}
