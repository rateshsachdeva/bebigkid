"use client";
import * as React from "react";
import { Switch as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";
export function Switch({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      {...props}
      className={cn(
        "inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-stone-300 transition-colors data-[state=checked]:bg-[#285b49] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#285b49] disabled:opacity-50",
        className,
      )}
    >
      <Primitive.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[22px]" />
    </Primitive.Root>
  );
}
