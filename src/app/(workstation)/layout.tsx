import { CommandBar, MobileNav } from "@/components/shell/command-bar";
import { Rail } from "@/components/shell/rail";
import { ListKeys } from "@/components/ui/list-keys";

/**
 * Workstation shell: navy rail at left, command bar on top, one scrolling workspace. The shell is
 * static; each screen streams its own data below it.
 */
export default function WorkstationLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid h-dvh grid-cols-1 grid-rows-[2.5rem_minmax(0,1fr)] md:grid-cols-[3.5rem_minmax(0,1fr)] min-[90rem]:grid-cols-[13rem_minmax(0,1fr)]">
      <a
        href="#workspace"
        className="sr-only z-50 bg-surface px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:top-1 focus:left-1"
      >
        Skip to workspace
      </a>
      <div className="row-span-2 hidden md:block">
        <Rail />
      </div>
      <CommandBar />
      <main id="workspace" className="min-w-0 scroll-thin overflow-y-auto">
        {children}
      </main>
      <MobileNav />
      <ListKeys />
    </div>
  );
}
