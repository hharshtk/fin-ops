"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const DATE = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/20\d{2}$/;

/**
 * Record a filing made on the government portal: acknowledgement and date. Validates format only;
 * nothing is saved in Phase 1.
 */
export function RecordFilingForm({
  form,
  today,
  idPrefix,
}: {
  form: string;
  today: string;
  idPrefix: string;
}) {
  const [ack, setAck] = useState("");
  const [filedOn, setFiledOn] = useState(today);
  const [errors, setErrors] = useState<{ ack?: string; filedOn?: string }>({});
  const [saved, setSaved] = useState(false);
  const gst = /^(GSTR|IFF|PMT|CMP)/.test(form);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!ack.trim())
      next.ack = gst
        ? "Enter the ARN from the GST portal."
        : "Enter the acknowledgement or reference number.";
    else if (
      gst &&
      !/^AA\d{2}\d{4}\d{6}[A-Z0-9]$/.test(ack.trim().toUpperCase())
    )
      next.ack = "ARN should look like AA271126034871K (15 characters).";
    if (!DATE.test(filedOn))
      next.filedOn = "Use DD/MM/YYYY, for example 17/11/2026.";
    setErrors(next);
    if (Object.keys(next).length === 0) setSaved(true);
  }

  if (saved) {
    return (
      <div className="flex items-start gap-2 text-sm" role="status">
        <Check aria-hidden className="mt-0.5 size-4 text-sig-green-ink" />
        <div>
          <p className="font-medium">Filing recorded (sample)</p>
          <p className="ident text-ink-2">
            {ack.toUpperCase()} · {filedOn}
          </p>
          <button
            type="button"
            onClick={() => setSaved(false)}
            className="mt-1 text-sm text-navy underline"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <div className="grid grid-cols-[1fr_8.5rem] gap-2">
        <Field
          label={gst ? "ARN" : "Acknowledgement no."}
          htmlFor={`${idPrefix}-ack`}
          error={errors.ack}
          required
        >
          <Input
            id={`${idPrefix}-ack`}
            value={ack}
            onChange={(e) => setAck(e.target.value)}
            placeholder={gst ? "AA271126034871K" : "Reference"}
            aria-invalid={errors.ack ? true : undefined}
            autoComplete="off"
            spellCheck={false}
            className="ident uppercase placeholder:normal-case"
          />
        </Field>
        <Field
          label="Filed on"
          htmlFor={`${idPrefix}-date`}
          error={errors.filedOn}
          required
        >
          <Input
            id={`${idPrefix}-date`}
            value={filedOn}
            onChange={(e) => setFiledOn(e.target.value)}
            inputMode="numeric"
            placeholder="DD/MM/YYYY"
            aria-invalid={errors.filedOn ? true : undefined}
            className="figures"
          />
        </Field>
      </div>
      <Field
        label="Acknowledgement PDF"
        htmlFor={`${idPrefix}-file`}
        hint="Attach the portal acknowledgement. Optional."
      >
        <input
          id={`${idPrefix}-file`}
          type="file"
          accept="application/pdf"
          className="text-sm text-ink-2 file:mr-3 file:h-7 file:rounded-[3px] file:border file:border-line-strong file:bg-surface file:px-2.5 file:text-sm file:text-ink hover:file:bg-hover"
        />
      </Field>
      <div>
        <Button type="submit" variant="primary">
          Record filing
        </Button>
      </div>
    </form>
  );
}
