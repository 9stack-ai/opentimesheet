"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/** Submit button that disables itself while the enclosing form's server action is
 *  pending — prevents duplicate records from rapid double-clicks. Must be rendered
 *  inside the <form> it submits. */
export function SubmitButton({
  children,
  pendingText = "Đang lưu…",
  disabled,
  ...props
}: ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
