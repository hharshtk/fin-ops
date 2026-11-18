"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import type { Constitution, GstScheme, Service } from "@/domain/types";

const CONSTITUTIONS: Constitution[] = [
  "Private Ltd",
  "Public Ltd",
  "OPC",
  "LLP",
  "Partnership",
  "Proprietorship",
  "Individual",
  "HUF",
  "Trust",
];
const SCHEMES: GstScheme[] = ["Monthly", "QRMP", "Composition", "Unregistered"];
const SERVICES: Service[] = [
  "GST",
  "Income tax",
  "TDS",
  "Audit",
  "ROC",
  "Accounting",
  "Payroll",
  "Advisory",
];

/** The PAN's fourth character encodes the holder's status. */
const PAN_HOLDER: Record<string, string> = {
  C: "Company",
  P: "Individual",
  H: "HUF",
  F: "Firm or LLP",
  T: "Trust",
  A: "Association of persons",
  B: "Body of individuals",
  L: "Local authority",
  J: "Artificial juridical person",
  G: "Government",
};

const STATES: Record<string, string> = {
  "27": "Maharashtra",
  "24": "Gujarat",
  "29": "Karnataka",
  "07": "Delhi",
  "33": "Tamil Nadu",
  "36": "Telangana",
};

const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/;
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

type Errors = Partial<
  Record<"name" | "pan" | "gstin" | "mobile" | "email", string>
>;

export function NewClientForm({
  staff,
}: {
  staff: { id: string; name: string; role: string }[];
}) {
  const [name, setName] = useState("");
  const [constitution, setConstitution] = useState<Constitution>("Private Ltd");
  const [pan, setPan] = useState("");
  const [scheme, setScheme] = useState<GstScheme>("Monthly");
  const [gstin, setGstin] = useState("");
  const [tan, setTan] = useState("");
  const [services, setServices] = useState<Service[]>(["GST", "Income tax"]);
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);

  const panU = pan.toUpperCase();
  const holder = PAN_RE.test(panU) ? PAN_HOLDER[panU[3]!] : undefined;
  const gstU = gstin.toUpperCase();
  const state = gstU.length >= 2 ? STATES[gstU.slice(0, 2)] : undefined;
  const company = ["Private Ltd", "Public Ltd", "OPC"].includes(constitution);

  const schedule: string[] = [];
  if (scheme === "Monthly")
    schedule.push("GSTR-1 monthly, 11th", "GSTR-3B monthly, 20th");
  if (scheme === "QRMP")
    schedule.push(
      "IFF, 13th (months 1 and 2)",
      "PMT-06, 25th",
      "GSTR-1 and GSTR-3B quarterly",
    );
  if (scheme === "Composition")
    schedule.push("CMP-08 quarterly, 18th", "GSTR-4 annual");
  if (tan.trim())
    schedule.push(
      "TDS payment, 7th",
      "24Q / 26Q quarterly",
      "Form 16A quarterly",
    );
  if (company) schedule.push("AOC-4 and MGT-7 after AGM", "ITR-6");
  if (constitution === "LLP") schedule.push("Form 8 and Form 11", "ITR-5");
  if (services.includes("Audit"))
    schedule.push("Tax audit report (3CA/3CB-3CD)");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (!name.trim())
      next.name = "Enter the client's legal name as on the PAN.";
    if (!PAN_RE.test(panU))
      next.pan =
        "PAN is 10 characters: 5 letters, 4 digits, 1 letter (AABCM4821K).";
    if (scheme !== "Unregistered") {
      if (!GSTIN_RE.test(gstU))
        next.gstin = "GSTIN is 15 characters, e.g. 27AABCM4821K1ZQ.";
      else if (PAN_RE.test(panU) && gstU.slice(2, 12) !== panU)
        next.gstin = "Characters 3 to 12 of the GSTIN should match the PAN.";
    }
    if (mobile && !/^[6-9]\d{9}$/.test(mobile.replace(/\s/g, "")))
      next.mobile = "Enter a 10-digit Indian mobile number.";
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      next.email = "Check the email address.";
    setErrors(next);
    if (Object.keys(next).length === 0) setSaved(true);
  }

  if (saved) {
    return (
      <div className="max-w-xl px-4 py-8" role="status">
        <p className="flex items-center gap-2 text-base font-semibold">
          <Check aria-hidden className="size-4 text-sig-green-ink" />
          {name} added (sample)
        </p>
        <p className="mt-1 text-sm text-ink-2">
          In the live product this creates the client and schedules{" "}
          {schedule.length} recurring filings. Nothing was saved in this phase.
        </p>
        <div className="mt-4 flex gap-2">
          <ButtonLink href="/clients" variant="primary">
            Back to clients
          </ButtonLink>
          <Button onClick={() => setSaved(false)}>Edit details</Button>
        </div>
      </div>
    );
  }

  const section = "grid gap-x-4 gap-y-3 sm:grid-cols-2";

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-px bg-line xl:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <div className="flex flex-col divide-y divide-line bg-surface">
        <fieldset className="px-4 py-4">
          <legend className="float-left mb-3 w-full caps text-ink-3">
            Identity
          </legend>
          <div className={cn(section, "clear-left")}>
            <Field
              label="Legal name"
              htmlFor="nc-name"
              error={errors.name}
              required
              className="sm:col-span-2"
            >
              <Input
                id="nc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="As on PAN"
                aria-invalid={errors.name ? true : undefined}
              />
            </Field>
            <Field label="Constitution" htmlFor="nc-const">
              <Select
                id="nc-const"
                value={constitution}
                onChange={(e) =>
                  setConstitution(e.target.value as Constitution)
                }
              >
                {CONSTITUTIONS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field
              label="PAN"
              htmlFor="nc-pan"
              required
              error={errors.pan}
              hint={
                holder ? `Fourth character ${panU[3]}: ${holder}` : "AAAAA9999A"
              }
            >
              <Input
                id="nc-pan"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                maxLength={10}
                autoComplete="off"
                spellCheck={false}
                className="ident uppercase"
                aria-invalid={errors.pan ? true : undefined}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="px-4 py-4">
          <legend className="float-left mb-3 w-full caps text-ink-3">
            Registrations
          </legend>
          <div className={cn(section, "clear-left")}>
            <Field label="GST scheme" htmlFor="nc-scheme">
              <Select
                id="nc-scheme"
                value={scheme}
                onChange={(e) => setScheme(e.target.value as GstScheme)}
              >
                {SCHEMES.map((s) => (
                  <option key={s} value={s}>
                    {s === "QRMP"
                      ? "QRMP (quarterly return, monthly payment)"
                      : s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="GSTIN"
              htmlFor="nc-gstin"
              error={errors.gstin}
              required={scheme !== "Unregistered"}
              hint={
                state
                  ? `State code ${gstU.slice(0, 2)}: ${state}`
                  : "15 characters"
              }
            >
              <Input
                id="nc-gstin"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                maxLength={15}
                disabled={scheme === "Unregistered"}
                autoComplete="off"
                spellCheck={false}
                className="ident uppercase"
                aria-invalid={errors.gstin ? true : undefined}
              />
            </Field>
            <Field
              label="TAN"
              htmlFor="nc-tan"
              hint="If the client deducts TDS"
            >
              <Input
                id="nc-tan"
                value={tan}
                onChange={(e) => setTan(e.target.value)}
                maxLength={10}
                className="ident uppercase"
                spellCheck={false}
              />
            </Field>
            <Field
              label={constitution === "LLP" ? "LLPIN" : "CIN"}
              htmlFor="nc-reg"
              hint={
                company || constitution === "LLP"
                  ? "From MCA master data"
                  : "Not applicable"
              }
            >
              <Input
                id="nc-reg"
                disabled={!(company || constitution === "LLP")}
                className="ident uppercase"
                spellCheck={false}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="px-4 py-4">
          <legend className="float-left mb-3 w-full caps text-ink-3">
            Engagement
          </legend>
          <div className={cn(section, "clear-left")}>
            <Field label="Partner" htmlFor="nc-partner">
              <Select id="nc-partner" defaultValue="md">
                {staff
                  .filter((s) => s.role === "Partner")
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Manager" htmlFor="nc-manager">
              <Select id="nc-manager" defaultValue="rs">
                {staff
                  .filter((s) => s.role === "Manager")
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-xs font-medium text-ink-2">Services</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {SERVICES.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={services.includes(s)}
                      onChange={() =>
                        setServices((cur) =>
                          cur.includes(s)
                            ? cur.filter((x) => x !== s)
                            : [...cur, s],
                        )
                      }
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <Field
              label="Annual retainer (₹)"
              htmlFor="nc-fee"
              hint="Before GST"
            >
              <Input
                id="nc-fee"
                inputMode="numeric"
                placeholder="1,20,000"
                className="figures"
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="px-4 py-4">
          <legend className="float-left mb-3 w-full caps text-ink-3">
            Primary contact
          </legend>
          <div className={cn(section, "clear-left")}>
            <Field label="Name" htmlFor="nc-cname">
              <Input id="nc-cname" />
            </Field>
            <Field label="Role" htmlFor="nc-role">
              <Input id="nc-role" placeholder="Director, Proprietor, CFO" />
            </Field>
            <Field
              label="Mobile (WhatsApp)"
              htmlFor="nc-mobile"
              error={errors.mobile}
              hint="Reminders go to this number"
            >
              <div className="flex">
                <span className="inline-flex h-8 items-center rounded-l-[3px] border border-r-0 border-line-strong bg-sunken px-2 text-sm text-ink-2 figures">
                  +91
                </span>
                <Input
                  id="nc-mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  inputMode="numeric"
                  placeholder="98220 41187"
                  className="rounded-l-none figures"
                  aria-invalid={errors.mobile ? true : undefined}
                />
              </div>
            </Field>
            <Field label="Email" htmlFor="nc-email" error={errors.email}>
              <Input
                id="nc-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={errors.email ? true : undefined}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <Checkbox defaultChecked />
              Client agreed to receive reminders on WhatsApp
            </label>
          </div>
        </fieldset>

        <div className="sticky bottom-0 flex items-center gap-2 border-t border-line bg-surface px-4 py-3">
          <Button type="submit" variant="primary" size="md">
            Add client
          </Button>
          <Link
            href="/clients"
            className="px-2 text-sm text-ink-2 hover:text-ink"
          >
            Cancel
          </Link>
          <span className="ml-auto text-xs text-ink-3">
            Fields marked * are required
          </span>
        </div>
      </div>

      <aside className="bg-surface px-4 py-4">
        <h2 className="mb-1 caps text-ink-3">Filings that will be scheduled</h2>
        <p className="mb-3 text-sm text-ink-2">
          Worked out from the registrations on the left. Preview only.
        </p>
        {schedule.length ? (
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {schedule.map((s) => (
              <li key={s} className="flex h-8 items-center gap-2 text-sm">
                <span aria-hidden className="size-1.5 rounded-[1px] bg-navy" />
                {s}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-3">
            Choose a GST scheme, TAN or constitution to see the schedule.
          </p>
        )}
      </aside>
    </form>
  );
}
