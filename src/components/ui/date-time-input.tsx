import type { InputProps } from "@/components/ui/input";
import { Input } from "@/components/ui/input";

export function DateInput(props: Omit<InputProps, "type">) {
  return <Input type="date" {...props} />;
}

export function TimeInput(props: Omit<InputProps, "type">) {
  return <Input type="time" {...props} />;
}
