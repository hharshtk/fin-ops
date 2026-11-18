/**
 * Cockpit grid: header and summary line span the top; the boards fill `main`; the inspector
 * column is `panel`. The page places its parts into these areas (its root is `display: contents`),
 * and an explicit selection renders into the same `panel` area from the slot. Row clicks are
 * intercepted into the slot, so the boards are not re-rendered or re-sent.
 */
export default function CockpitLayout({ children, panel }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-full grid-cols-1 content-start [grid-template-areas:'top'_'main'] lg:grid-cols-[minmax(0,1fr)_auto] lg:grid-rows-[auto_1fr] lg:content-stretch lg:[grid-template-areas:'top_top'_'main_panel']">
      {children}
      {panel}
    </div>
  );
}
