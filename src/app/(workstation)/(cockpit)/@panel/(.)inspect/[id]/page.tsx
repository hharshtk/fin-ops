// Soft navigation from the Cockpit: render only the panel. Only Cockpit rows link to
// /inspect/...; links from other screens use /?sel=, because a root-level intercept would match
// navigations from any page.
export { default } from "../../inspect/[id]/page";
