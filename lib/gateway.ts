import "server-only";
import { gateway, generateText, streamText } from "ai";
import { AppError, service } from "./server";
export async function activeModel() {
  const db = service();
  const { data: active, error } = await db
    .from("active_config")
    .select("config_id")
    .eq("singleton", true)
    .single();
  if (error || !active?.config_id)
    throw new AppError(
      "The assistant is not available yet. Your saved information is still accessible.",
      503,
    );
  const { data: config } = await db
    .from("ai_config_versions")
    .select("*")
    .eq("id", active.config_id)
    .single();
  if (!config || !config.privacy_reviewed || !config.behaviour_reviewed)
    throw new AppError("The assistant is awaiting review.", 503);
  return config;
}
export const modelOptions = (config: {
  model_id: string;
  providers: string[];
}) => ({
  model: gateway(config.model_id),
  providerOptions: { gateway: { only: config.providers } },
  maxRetries: 0,
});
export { gateway, generateText, streamText };
