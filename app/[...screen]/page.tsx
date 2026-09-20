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
}: {
  params: Promise<{ screen: string[] }>;
}) {
  const { screen } = await params;
  const route = screen.join("/");
  if (!routes.includes(route) && !/^chat\/[0-9a-f-]{36}$/.test(route))
    notFound();
  return <Workspace initialPage={route} />;
}
