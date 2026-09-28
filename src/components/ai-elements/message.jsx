"use client";

/*
 * AI Elements `message` (https://ai-sdk.dev/elements) — installed via the shadcn registry, then
 * trimmed to the parts the Academy renders (AET-120).
 *
 * Dropped on purpose: MessageResponse (Streamdown markdown streaming), MessageBranch* and
 * MessageAttachment*. The Academy FAQ/coach surface renders server-rendered day-pack answers, not
 * a streamed model response, and `memo(<Streamdown/>)` at module scope defeats tree-shaking —
 * keeping it pulled shiki + katex + mermaid into the legacy bundle for no user-visible gain.
 * Re-add from the registry the day the surface streams markdown.
 */

import { cn } from "@/lib/utils";

export const Message = ({
  className,
  from,
  ...props
}) => (
  <div
    className={cn(
      "group flex w-full max-w-[95%] flex-col gap-2",
      from === "user" ? "is-user ml-auto justify-end" : "is-assistant",
      className
    )}
    {...props}
  />
);

export const MessageContent = ({
  children,
  className,
  ...props
}) => (
  <div
    className={cn(
      "is-user:dark flex w-fit max-w-full min-w-0 flex-col gap-2 overflow-hidden text-sm",
      "group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:bg-secondary group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-foreground",
      "group-[.is-assistant]:text-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const MessageActions = ({
  className,
  children,
  ...props
}) => (
  <div className={cn("flex items-center gap-1", className)} {...props}>
    {children}
  </div>
);

export const MessageToolbar = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      "mt-4 flex w-full items-center justify-between gap-4",
      className
    )}
    {...props}
  >
    {children}
  </div>
);
