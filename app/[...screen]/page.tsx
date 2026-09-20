import { notFound } from "next/navigation";
import Workspace from "@/components/workspace";
const routes = [
  "sign-in",
  "welcome",
  "chat",
  "journal",
  "child",
  "settings",
  "settings/memory",
  "settings/privacy",
  "settings/account",
  "help",
  "privacy",
  "terms",
  "admin",
  "admin/models",
  "admin/knowledge",
  "admin/operations",
];
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ screen: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ screen }, query] = await Promise.all([params, searchParams]);
  const route = screen.join("/");
  if (!routes.includes(route) && !/^chat\/[0-9a-f-]{36}$/.test(route))
    notFound();
  const initialError =
    route === "sign-in" && query.auth_error === "google"
      ? "Google sign-in could not be completed. Please try again."
      : "";
  return <Workspace initialPage={route} initialError={initialError} />;
}
