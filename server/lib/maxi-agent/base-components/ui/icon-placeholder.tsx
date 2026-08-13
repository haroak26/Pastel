import * as React from "react"
import { CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, CircleCheckIcon, InfoIcon, Loader2Icon, MinusIcon, MoreHorizontalIcon, OctagonXIcon, PanelLeftIcon, SearchIcon, TriangleAlertIcon, XIcon } from "lucide-react"

const iconMap = { CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, CircleCheckIcon, InfoIcon, Loader2Icon, MinusIcon, MoreHorizontalIcon, OctagonXIcon, PanelLeftIcon, SearchIcon, TriangleAlertIcon, XIcon } as const

/** Vendored shadcn IconPlaceholder (lucide-only). Props are the icon-library
 *  names from the registry (lucide/tabler/hugeicons/phosphor/remixicon) plus
 *  svg props; only the lucide name is honored. */
export function IconPlaceholder({
  lucide,
  tabler,
  hugeicons,
  phosphor,
  remixicon,
  ...props
}: {
  lucide?: string
  tabler?: string
  hugeicons?: string
  phosphor?: string
  remixicon?: string
} & React.ComponentProps<"svg">) {
  const name = lucide ?? tabler ?? hugeicons ?? phosphor ?? remixicon
  if (!name) return null
  const Icon = iconMap[name as keyof typeof iconMap]
  if (!Icon) return null
  return <Icon {...props} />
}
