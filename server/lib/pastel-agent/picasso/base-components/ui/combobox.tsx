"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ChevronDownIcon, XIcon, CheckIcon } from "lucide-react"

type ComboboxItemDefinition = {
  disabled?: boolean
  label?: string
  value: string
}

type ComboboxContextValue = {
  autoHighlight: boolean
  baseId: string
  open: boolean
  setOpen: (open: boolean) => void
  disabled: boolean
  multiple: boolean
  selectedValues: string[]
  toggleValue: (value: string) => void
  clearValue: (value?: string) => void
  search: string
  setSearch: (search: string) => void
  filter: (label: string, search: string) => boolean
  definitions: ReadonlyMap<string, ComboboxItemDefinition>
  registerDefinition: (definition: ComboboxItemDefinition) => () => void
  itemElements: ReadonlyMap<string, HTMLElement>
  registerItemElement: (value: string, element: HTMLElement | null) => void
  rawItems: readonly unknown[]
  stringifyValue: (value: unknown) => string
  matchedValues: string[]
  dataEmpty: boolean
  highlightedValue: string | null
  setHighlightedValue: (value: string | null) => void
  getItemLabel: (value: string) => string
  inputElement: HTMLInputElement | null
  registerInput: (element: HTMLInputElement | null) => void
  triggerElement: HTMLElement | null
  registerTrigger: (element: HTMLElement | null) => void
}

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null)
const ComboboxChipValueContext = React.createContext<string | null>(null)

function useComboboxContext() {
  const context = React.useContext(ComboboxContext)
  if (!context) {
    throw new Error(
      "Combobox components must be used within a Combobox root component."
    )
  }
  return context
}

function defaultFilter(label: string, search: string) {
  return label.toLowerCase().includes(search.toLowerCase())
}

function Combobox({
  autoHighlight = false,
  defaultValue,
  disabled = false,
  filter = defaultFilter,
  items,
  itemToStringValue = String,
  multiple = false,
  onOpenChange,
  onValueChange,
  open: controlledOpen,
  value: controlledValue,
  children,
}: {
  autoHighlight?: boolean
  children?: React.ReactNode
  defaultValue?: string | string[]
  disabled?: boolean
  filter?: (label: string, search: string) => boolean
  items?: readonly unknown[]
  itemToStringValue?: (item: unknown) => string
  multiple?: boolean
  onOpenChange?: (open: boolean) => void
  onValueChange?: (value: string | string[]) => void
  open?: boolean
  value?: string | string[]
}) {
  const baseId = React.useId()
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const [uncontrolledValue, setUncontrolledValue] = React.useState<
    string[]
  >(() => {
    const initial = defaultValue ?? []
    return Array.isArray(initial) ? [...initial] : initial ? [initial] : []
  })
  const [definitions, setDefinitions] = React.useState<
    Map<string, ComboboxItemDefinition>
  >(new Map())
  const [itemElements, setItemElements] = React.useState<
    Map<string, HTMLElement>
  >(new Map())
  const [search, setSearch] = React.useState("")
  const [highlightedValue, setHighlightedValue] = React.useState<string | null>(
    null
  )
  const [inputElement, setInputElement] = React.useState<HTMLInputElement | null>(
    null
  )
  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(
    null
  )

  const open = controlledOpen ?? uncontrolledOpen
  const selectedValues = controlledValue
    ? Array.isArray(controlledValue)
      ? controlledValue
      : [controlledValue]
    : uncontrolledValue

  const stringifyValue = React.useCallback(
    (value: unknown) => itemToStringValue(value as never),
    [itemToStringValue]
  )

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      setUncontrolledOpen(nextOpen)
      onOpenChange?.(nextOpen)
    },
    [onOpenChange]
  )

  const setValue = React.useCallback(
    (nextValues: string[]) => {
      setUncontrolledValue(nextValues)
      onValueChange?.(multiple ? [...nextValues] : (nextValues[0] ?? ""))
    },
    [multiple, onValueChange]
  )

  const toggleValue = React.useCallback(
    (value: string) => {
      setValue(
        multiple
          ? selectedValues.includes(value)
            ? selectedValues.filter((selectedValue) => selectedValue !== value)
            : [...selectedValues, value]
          : selectedValues.includes(value)
            ? []
            : [value]
      )
      if (!multiple) {
        setOpen(false)
        setSearch("")
      }
    },
    [multiple, selectedValues, setOpen, setValue]
  )

  const clearValue = React.useCallback(
    (value?: string) => {
      setValue(
        value === undefined
          ? []
          : selectedValues.filter((selectedValue) => selectedValue !== value)
      )
    },
    [selectedValues, setValue]
  )

  const registerDefinition = React.useCallback(
    (definition: ComboboxItemDefinition) => {
      setDefinitions((currentDefinitions) => {
        const nextDefinitions = new Map(currentDefinitions)
        nextDefinitions.set(definition.value, {
          ...nextDefinitions.get(definition.value),
          ...definition,
        })
        return nextDefinitions
      })
      return () => {
        setDefinitions((currentDefinitions) => {
          const nextDefinitions = new Map(currentDefinitions)
          nextDefinitions.delete(definition.value)
          return nextDefinitions
        })
      }
    },
    []
  )

  const registerItemElement = React.useCallback(
    (value: string, element: HTMLElement | null) => {
      setItemElements((currentElements) => {
        const nextElements = new Map(currentElements)
        if (element) {
          nextElements.set(value, element)
        } else {
          nextElements.delete(value)
        }
        return nextElements
      })
    },
    []
  )

  const normalizedItems = React.useMemo(() => {
    if (!items) {
      return undefined
    }
    return items.map((item) => {
      const value = stringifyValue(item)
      const label =
        typeof item === "string" || typeof item === "number" ? String(item) : undefined
      return { disabled: false, label: label ?? value, value }
    })
  }, [items, stringifyValue])

  const allDefinitions = React.useMemo(() => {
    const map = new Map<string, ComboboxItemDefinition>()
    for (const definition of normalizedItems ?? []) {
      map.set(definition.value, definition)
    }
    for (const [value, definition] of definitions) {
      map.set(value, definition)
    }
    return map
  }, [definitions, normalizedItems])

  const matchedValues = React.useMemo(() => {
    if (!search) {
      return [...allDefinitions.keys()]
    }
    return [...allDefinitions.entries()]
      .filter(
        ([value, definition]) =>
          !definition.disabled &&
          filter(
            definition.label ??
              (itemElements.get(value)?.textContent?.trim() ?? value),
            search
          )
      )
      .map(([value]) => value)
  }, [allDefinitions, filter, itemElements, search])

  const dataEmpty = allDefinitions.size > 0 && matchedValues.length === 0

  React.useEffect(() => {
    if (
      autoHighlight &&
      open &&
      matchedValues.length > 0 &&
      !matchedValues.includes(highlightedValue ?? "")
    ) {
      setHighlightedValue(matchedValues[0])
    }
  }, [autoHighlight, highlightedValue, matchedValues, open])

  const getItemLabel = React.useCallback(
    (value: string) =>
      allDefinitions.get(value)?.label ??
      itemElements.get(value)?.textContent?.trim() ??
      value,
    [allDefinitions, itemElements]
  )

  const registerInput = React.useCallback((element: HTMLInputElement | null) => {
    setInputElement(element)
  }, [])

  const registerTrigger = React.useCallback((element: HTMLElement | null) => {
    setTriggerElement(element)
  }, [])

  const context = React.useMemo<ComboboxContextValue>(
    () => ({
      autoHighlight,
      baseId,
      open,
      setOpen,
      disabled,
      multiple,
      selectedValues,
      toggleValue,
      clearValue,
      search,
      setSearch,
      filter,
      definitions: allDefinitions,
      registerDefinition,
      itemElements,
      registerItemElement,
      rawItems: items ?? [],
      stringifyValue,
      matchedValues,
      dataEmpty,
      highlightedValue,
      setHighlightedValue,
      getItemLabel,
      inputElement,
      registerInput,
      triggerElement,
      registerTrigger,
    }),
    [
      autoHighlight,
      baseId,
      open,
      setOpen,
      disabled,
      multiple,
      selectedValues,
      toggleValue,
      clearValue,
      search,
      filter,
      allDefinitions,
      registerDefinition,
      itemElements,
      registerItemElement,
      items,
      stringifyValue,
      matchedValues,
      dataEmpty,
      highlightedValue,
      getItemLabel,
      inputElement,
      registerInput,
      triggerElement,
      registerTrigger,
    ]
  )

  return (
    <ComboboxContext.Provider value={context}>
      {children}
    </ComboboxContext.Provider>
  )
}

function ComboboxValue({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  const { getItemLabel, multiple, selectedValues } = useComboboxContext()

  if (selectedValues.length === 0) {
    if (children === undefined || children === null || children === "") {
      return null
    }
    return (
      <span data-slot="combobox-value" className={className} {...props}>
        {children}
      </span>
    )
  }

  if (multiple) {
    return (
      <span data-slot="combobox-value" className={className} {...props}>
        {selectedValues.map((value) => (
          <ComboboxChipValueContext.Provider key={value} value={value}>
            {children ?? getItemLabel(value)}
          </ComboboxChipValueContext.Provider>
        ))}
      </span>
    )
  }

  return (
    <span data-slot="combobox-value" className={className} {...props}>
      {children ?? getItemLabel(selectedValues[0])}
    </span>
  )
}

function ComboboxTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  const { baseId, open, setOpen, registerTrigger } = useComboboxContext()
  const [pressed, setPressed] = React.useState(false)

  return (
    <button
      type="button"
      ref={registerTrigger}
      data-slot="combobox-trigger"
      data-pressed={pressed ? "" : undefined}
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={`${baseId}-listbox`}
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return
        }
        setPressed(true)
        props.onPointerDown?.(event)
      }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onClick={(event) => {
        setOpen(!open)
        props.onClick?.(event)
      }}
      className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      {children}
      <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
    </button>
  )
}

function ComboboxClear({
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { clearValue } = useComboboxContext()

  return (
    <InputGroupButton
      variant="ghost"
      size="icon-xs"
      disabled={disabled}
      data-slot="combobox-clear"
      aria-label="Clear"
      onClick={(event) => {
        event.stopPropagation()
        clearValue()
        props.onClick?.(event)
      }}
      className={cn(className)}
      {...props}
    >
      <XIcon className="pointer-events-none" />
    </InputGroupButton>
  )
}

function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: React.ComponentProps<"input"> & {
  showTrigger?: boolean
  showClear?: boolean
}) {
  const {
    baseId,
    disabled: contextDisabled,
    highlightedValue,
    matchedValues,
    open,
    registerInput,
    search,
    setHighlightedValue,
    setOpen,
    setSearch,
    toggleValue,
  } = useComboboxContext()
  const [pressed, setPressed] = React.useState(false)
  const isDisabled = contextDisabled || disabled

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    props.onKeyDown?.(event)
    if (event.defaultPrevented || isDisabled) {
      return
    }

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault()
        if (!open) {
          setOpen(true)
          setHighlightedValue(matchedValues[0] ?? null)
          return
        }
        const currentIndex = matchedValues.indexOf(highlightedValue ?? "")
        const nextIndex =
          currentIndex < 0 || currentIndex === matchedValues.length - 1
            ? 0
            : currentIndex + 1
        setHighlightedValue(matchedValues[nextIndex] ?? null)
        break
      }
      case "ArrowUp": {
        event.preventDefault()
        if (!open) {
          return
        }
        const currentIndex = matchedValues.indexOf(highlightedValue ?? "")
        const nextIndex =
          currentIndex <= 0
            ? matchedValues.length - 1
            : currentIndex - 1
        setHighlightedValue(matchedValues[nextIndex] ?? null)
        break
      }
      case "Home": {
        if (!open) {
          return
        }
        event.preventDefault()
        setHighlightedValue(matchedValues[0] ?? null)
        break
      }
      case "End": {
        if (!open) {
          return
        }
        event.preventDefault()
        setHighlightedValue(
          matchedValues[matchedValues.length - 1] ?? null
        )
        break
      }
      case "Enter": {
        event.preventDefault()
        if (!open) {
          setOpen(true)
          return
        }
        if (highlightedValue) {
          toggleValue(highlightedValue)
        }
        break
      }
      case "Escape": {
        if (!open) {
          return
        }
        event.preventDefault()
        setOpen(false)
        break
      }
    }
  }

  return (
    <InputGroup className={cn("w-auto", className)}>
      <InputGroupInput
        ref={registerInput}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${baseId}-listbox`}
        aria-activedescendant={
          open && highlightedValue
            ? `${baseId}-item-${highlightedValue}`
            : undefined
        }
        aria-autocomplete="list"
        disabled={isDisabled}
        value={search}
        onChange={(event) => {
          setSearch(event.target.value)
          if (!open) {
            setOpen(true)
          }
          props.onChange?.(event)
        }}
        onKeyDown={handleKeyDown}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            type="button"
            disabled={isDisabled}
            data-slot="input-group-button"
            data-pressed={pressed ? "" : undefined}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={`${baseId}-listbox`}
            className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
            onPointerDown={(event) => {
              if (event.button === 0) {
                setPressed(true)
              }
            }}
            onPointerUp={() => setPressed(false)}
            onPointerLeave={() => setPressed(false)}
            onPointerCancel={() => setPressed(false)}
            onClick={(event) => {
              event.preventDefault()
              setOpen(!open)
              props.onClick?.(event)
            }}
          >
            <ChevronDownIcon className="pointer-events-none" />
          </InputGroupButton>
        )}
        {showClear && <ComboboxClear disabled={isDisabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  )
}

type ComboboxPosition = {
  left: number
  top?: number
  bottom?: number
  side: "top" | "bottom"
  anchorWidth: number
  availableHeight: number
  availableWidth: number
  transformOrigin: string
}

function computeComboboxPosition(
  anchor: HTMLElement,
  side: "top" | "bottom",
  sideOffset: number,
  align: "start" | "center" | "end",
  alignOffset: number
): ComboboxPosition {
  const anchorRect = anchor.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const spaceBelow = viewportHeight - anchorRect.bottom
  const spaceAbove = anchorRect.top
  const flipToTop =
    side === "bottom" && spaceBelow < 200 && spaceAbove > spaceBelow
  const actualSide = flipToTop ? "top" : side

  const availableHeight = Math.max(
    0,
    (actualSide === "bottom" ? spaceBelow : spaceAbove) - sideOffset
  )
  const anchorWidth = anchorRect.width
  let left = anchorRect.left + alignOffset
  if (align === "center") {
    left = anchorRect.left + anchorRect.width / 2 - anchorWidth / 2 + alignOffset
  } else if (align === "end") {
    left = anchorRect.right - anchorWidth - alignOffset
  }
  left = Math.max(8, Math.min(left, viewportWidth - anchorWidth - 8))

  const availableWidth = Math.max(0, viewportWidth - left - 8)
  const originX = align === "end" ? "right" : align === "center" ? "center" : "left"
  const originY = actualSide === "top" ? "bottom" : "top"

  return {
    left,
    top:
      actualSide === "bottom"
        ? anchorRect.bottom + sideOffset
        : undefined,
    bottom:
      actualSide === "top"
        ? viewportHeight - anchorRect.top + sideOffset
        : undefined,
    side: actualSide,
    anchorWidth,
    availableHeight,
    availableWidth,
    transformOrigin: `${originX} ${originY}`,
  }
}

type ComboboxAnchor =
  | React.RefObject<HTMLElement | null>
  | HTMLElement
  | null
  | undefined

function resolveAnchorElement(anchor: ComboboxAnchor): HTMLElement | null {
  if (!anchor) {
    return null
  }
  return "current" in anchor ? anchor.current : anchor
}

function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "top" | "bottom"
  sideOffset?: number
  align?: "start" | "center" | "end"
  alignOffset?: number
  anchor?: ComboboxAnchor
}) {
  const { baseId, dataEmpty, inputElement, open, triggerElement } =
    useComboboxContext()
  const [position, setPosition] = React.useState<ComboboxPosition | null>(null)

  const anchorElementResolved =
    resolveAnchorElement(anchor) ?? triggerElement ?? inputElement

  React.useLayoutEffect(() => {
    if (!open || !anchorElementResolved) {
      setPosition(null)
      return
    }

    const update = () => {
      setPosition(
        computeComboboxPosition(
          anchorElementResolved,
          side,
          sideOffset,
          align,
          alignOffset
        )
      )
    }

    update()
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)

    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
    }
  }, [
    align,
    alignOffset,
    anchorElementResolved,
    open,
    side,
    sideOffset,
  ])

  if (!open) {
    return null
  }

  if (typeof document === "undefined") {
    return null
  }

  const popup = (
    <div
      data-slot="combobox-content"
      data-chips={!!anchor}
      data-side={position?.side ?? side}
      data-open=""
      data-empty={dataEmpty ? "" : undefined}
      role="presentation"
      className={cn(
        "group/combobox-content relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))] origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[chips=true]:min-w-(--anchor-width) data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-8 *:data-[slot=input-group]:border-input/30 *:data-[slot=input-group]:bg-input/30 *:data-[slot=input-group]:shadow-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        className
      )}
      style={{
        position: "fixed",
        zIndex: 50,
        left: position?.left,
        top: position?.top,
        bottom: position?.bottom,
        "--anchor-width": position
          ? `${position.anchorWidth}px`
          : undefined,
        "--available-height": position
          ? `${position.availableHeight}px`
          : undefined,
        "--available-width": position
          ? `${position.availableWidth}px`
          : undefined,
        "--transform-origin": position?.transformOrigin,
      } as React.CSSProperties}
      {...props}
    />
  )

  return createPortal(popup, document.body)
}

function ComboboxList({
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  children?:
    | React.ReactNode
    | ((item: unknown, index: number) => React.ReactNode)
}) {
  const {
    baseId,
    dataEmpty,
    highlightedValue,
    matchedValues,
    rawItems,
    setHighlightedValue,
    stringifyValue,
  } = useComboboxContext()

  const renderedChildren =
    typeof children === "function"
      ? rawItems
          .filter((item) => matchedValues.includes(stringifyValue(item)))
          .map((item, index) => children(item, index))
      : children

  return (
    <div
      data-slot="combobox-list"
      data-empty={dataEmpty ? "" : undefined}
      role="listbox"
      id={`${baseId}-listbox`}
      aria-activedescendant={
        highlightedValue ? `${baseId}-item-${highlightedValue}` : undefined
      }
      onMouseLeave={() => setHighlightedValue(null)}
      className={cn(
        "no-scrollbar max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0",
        className
      )}
      {...props}
    >
      {renderedChildren}
    </div>
  )
}

function ComboboxItem({
  className,
  children,
  disabled = false,
  label,
  onSelect,
  value,
  ...props
}: React.ComponentProps<"div"> & {
  disabled?: boolean
  label?: string
  onSelect?: () => void
  value: unknown
}) {
  const {
    baseId,
    disabled: contextDisabled,
    highlightedValue,
    matchedValues,
    registerDefinition,
    registerItemElement,
    selectedValues,
    setHighlightedValue,
    stringifyValue,
    toggleValue,
  } = useComboboxContext()
  const elementRef = React.useRef<HTMLDivElement | null>(null)
  const itemValue = stringifyValue(value)

  React.useLayoutEffect(() => {
    registerItemElement(itemValue, elementRef.current)
    return () => registerItemElement(itemValue, null)
  }, [itemValue, registerItemElement])

  React.useLayoutEffect(
    () =>
      registerDefinition({
        disabled,
        label,
        value: itemValue,
      }),
    [disabled, label, itemValue, registerDefinition]
  )

  const matched = matchedValues.includes(itemValue)
  const highlighted = highlightedValue === itemValue
  const selected = selectedValues.includes(itemValue)
  const isDisabled = contextDisabled || disabled

  return (
    <div
      ref={elementRef}
      id={`${baseId}-item-${itemValue}`}
      data-slot="combobox-item"
      data-value={itemValue}
      data-highlighted={highlighted ? "" : undefined}
      data-selected={selected ? "" : undefined}
      data-disabled={isDisabled ? "" : undefined}
      role="option"
      aria-selected={selected || undefined}
      aria-disabled={isDisabled || undefined}
      hidden={!matched}
      onMouseMove={() => {
        if (!isDisabled) {
          setHighlightedValue(itemValue)
        }
      }}
      onClick={() => {
        if (isDisabled) {
          return
        }
        toggleValue(itemValue)
        onSelect?.()
      }}
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      {selected && (
        <span
          data-slot="combobox-item-indicator"
          className="pointer-events-none absolute right-2 flex size-4 items-center justify-center"
        >
          <CheckIcon className="pointer-events-none" />
        </span>
      )}
    </div>
  )
}

function ComboboxGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="combobox-group"
      role="group"
      className={cn(className)}
      {...props}
    />
  )
}

function ComboboxLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="combobox-label"
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function ComboboxCollection({
  items,
  ...props
}: React.ComponentProps<"div"> & {
  items?: readonly unknown[]
}) {
  const { registerDefinition, stringifyValue } = useComboboxContext()

  React.useLayoutEffect(() => {
    if (!items) {
      return
    }
    const cleanups = items.map((item) =>
      registerDefinition({
        disabled: false,
        value: stringifyValue(item),
      })
    )
    return () => cleanups.forEach((cleanup) => cleanup())
  }, [items, registerDefinition, stringifyValue])

  return (
    <div data-slot="combobox-collection" {...props} />
  )
}

function ComboboxEmpty({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="combobox-empty"
      className={cn(
        "hidden w-full justify-center py-2 text-center text-sm text-muted-foreground group-data-empty/combobox-content:flex",
        className
      )}
      {...props}
    />
  )
}

function ComboboxSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="combobox-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function ComboboxChips({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { baseId, inputElement, open } = useComboboxContext()

  return (
    <div
      data-slot="combobox-chips"
      role="listbox"
      aria-expanded={open}
      aria-controls={`${baseId}-listbox`}
      tabIndex={-1}
      onClick={() => {
        inputElement?.focus()
      }}
      className={cn(
        "flex min-h-8 flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent bg-clip-padding px-2.5 py-1 text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 has-data-[slot=combobox-chip]:px-1 dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

function ComboboxChip({
  className,
  children,
  showRemove = true,
  value,
  ...props
}: React.ComponentProps<"span"> & {
  showRemove?: boolean
  value?: string
}) {
  const { clearValue, getItemLabel } = useComboboxContext()
  const contextValue = React.useContext(ComboboxChipValueContext)
  const chipValue = value ?? contextValue

  if (chipValue === null) {
    return (
      <span data-slot="combobox-chip" className={cn(className)} {...props}>
        {children}
      </span>
    )
  }

  return (
    <span
      data-slot="combobox-chip"
      className={cn(
        "flex h-[calc(--spacing(5.25))] w-fit items-center justify-center gap-1 rounded-sm bg-muted px-1.5 text-xs font-medium whitespace-nowrap text-foreground has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-[slot=combobox-chip-remove]:pr-0",
        className
      )}
      {...props}
    >
      {children ?? getItemLabel(chipValue)}
      {showRemove && (
        <Button
          variant="ghost"
          size="icon-xs"
          type="button"
          aria-label={`Remove ${getItemLabel(chipValue)}`}
          className="-ml-1 opacity-50 hover:opacity-100"
          data-slot="combobox-chip-remove"
          onClick={(event) => {
            event.stopPropagation()
            clearValue(chipValue)
          }}
        >
          <XIcon className="pointer-events-none" />
        </Button>
      )}
    </span>
  )
}

function ComboboxChipsInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  const {
    baseId,
    disabled,
    highlightedValue,
    matchedValues,
    open,
    search,
    setHighlightedValue,
    setOpen,
    setSearch,
    toggleValue,
  } = useComboboxContext()

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    props.onKeyDown?.(event)
    if (event.defaultPrevented || disabled) {
      return
    }

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault()
        if (!open) {
          setOpen(true)
          setHighlightedValue(matchedValues[0] ?? null)
          return
        }
        const currentIndex = matchedValues.indexOf(highlightedValue ?? "")
        const nextIndex =
          currentIndex < 0 || currentIndex === matchedValues.length - 1
            ? 0
            : currentIndex + 1
        setHighlightedValue(matchedValues[nextIndex] ?? null)
        break
      }
      case "ArrowUp": {
        event.preventDefault()
        if (!open) {
          return
        }
        const currentIndex = matchedValues.indexOf(highlightedValue ?? "")
        const nextIndex =
          currentIndex <= 0 ? matchedValues.length - 1 : currentIndex - 1
        setHighlightedValue(matchedValues[nextIndex] ?? null)
        break
      }
      case "Enter": {
        event.preventDefault()
        if (!open) {
          setOpen(true)
          return
        }
        if (highlightedValue) {
          toggleValue(highlightedValue)
        }
        break
      }
      case "Escape": {
        if (!open) {
          return
        }
        event.preventDefault()
        setOpen(false)
        break
      }
    }
  }

  return (
    <input
      data-slot="combobox-chip-input"
      type="text"
      role="combobox"
      aria-expanded={open}
      aria-controls={`${baseId}-listbox`}
      aria-activedescendant={
        open && highlightedValue
          ? `${baseId}-item-${highlightedValue}`
          : undefined
      }
      aria-autocomplete="list"
      disabled={disabled}
      value={search}
      onChange={(event) => {
        setSearch(event.target.value)
        if (!open) {
          setOpen(true)
        }
        props.onChange?.(event)
      }}
      onKeyDown={handleKeyDown}
      className={cn("min-w-16 flex-1 outline-none", className)}
      {...props}
    />
  )
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null)
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  ComboboxClear,
  useComboboxAnchor,
}
export type { ComboboxItemDefinition }
