"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { buttonVariants, type Button } from "@/components/ui/button"
import { CheckIcon } from "lucide-react"

type QuestionnaireItemStatus = "unanswered" | "answered" | "skipped"
type QuestionnaireShortcutMode = "letters" | "numbers"

type QuestionnaireChoiceDefinition = {
  disabled?: boolean
  value: string
}

type QuestionnaireItemDefinition = {
  choices?: readonly QuestionnaireChoiceDefinition[]
  disabled?: boolean
  name: string
  required?: boolean
}

type QuestionnaireRootState = {
  current: number
  first: boolean
  last: boolean
  total: number
}

type QuestionnaireItemState = {
  active: boolean
  disabled: boolean
  invalid: boolean
  multiple: boolean
  required: boolean
  status: QuestionnaireItemStatus
}

type QuestionnaireChoiceState = {
  checked: boolean
  disabled: boolean
  invalid: boolean
  shortcut: string | null
  type: "checkbox" | "radio"
}

type QuestionnaireInputState = {
  disabled: boolean
  filled: boolean
  invalid: boolean
}

type QuestionnaireInputType =
  | "date"
  | "datetime-local"
  | "email"
  | "month"
  | "number"
  | "password"
  | "search"
  | "tel"
  | "text"
  | "time"
  | "url"
  | "week"

type AnswerControlRegistration = {
  disabled: boolean
  element: HTMLInputElement
  id: string
} & (
  | {
      ownDisabled: boolean
      type: "choice"
      value: string
    }
  | {
      type: "input"
    }
)

type ItemRegistration = {
  choices: readonly { disabled: boolean; value: string }[]
  disabled: boolean
  element: HTMLFieldSetElement
  focus: () => void
  focusInvalid: () => void
  getAnswerByElement: (element: Element) => AnswerControlRegistration | null
  getAnswerByShortcut: (shortcut: string) => AnswerControlRegistration | null
  moveAnswerFocus: (element: Element, direction: "next" | "previous") => boolean
  name: string
  required: boolean
  reset: () => void
  skip: () => void
  status: QuestionnaireItemStatus
  validate: () => boolean
}

type PendingFocus = {
  name: string
  target: "invalid" | "item"
}

type QuestionnaireContextValue = QuestionnaireRootState & {
  activeItem: ItemRegistration | null
  activeItemName: string | null
  activeItemRequired: boolean | null
  activeItemStatus: QuestionnaireItemStatus | null
  domVersion: number
  goNext: () => void
  goPrevious: () => void
  itemDefinitionByName: ReadonlyMap<
    string,
    QuestionnaireItemDefinition
  > | null
  nativeValidation: boolean
  registerItem: (registration: ItemRegistration) => () => void
  shortcuts: QuestionnaireShortcutMode | null
  skipCurrent: () => void
}

type QuestionnaireItemContextValue = {
  active: boolean
  disabled: boolean
  hasInputAnswer: boolean
  invalid: boolean
  multiple: boolean
  name: string
  registerAnswerControl: (registration: AnswerControlRegistration) => () => void
  registerAnswerSelection: (
    answerId: string,
    defaultSelected: boolean
  ) => () => void
  registerDescription: (descriptionId: string) => () => void
  registerError: (errorId: string) => () => void
  required: boolean
  resetVersion: number
  selectedAnswerIds: string[]
  setAnswerDefault: (answerId: string, defaultSelected: boolean) => void
  setAnswerSelectionFromInteraction: (
    answerId: string,
    selected: boolean
  ) => void
  shortcutByAnswerId: ReadonlyMap<string, string>
  shortcutByChoiceValue: ReadonlyMap<string, string> | null
  shortcuts: QuestionnaireShortcutMode | null
  status: QuestionnaireItemStatus
  syncControlledAnswerSelection: (answerId: string, selected: boolean) => void
}

type QuestionnaireChoiceContextValue = {
  inputProps: React.ComponentPropsWithRef<"input">
  state: QuestionnaireChoiceState
}

const QuestionnaireContext =
  React.createContext<QuestionnaireContextValue | null>(null)
const QuestionnaireItemContext =
  React.createContext<QuestionnaireItemContextValue | null>(null)
const QuestionnaireChoiceContext =
  React.createContext<QuestionnaireChoiceContextValue | null>(null)

function useQuestionnaireContext(component: string) {
  const context = React.useContext(QuestionnaireContext)
  if (!context) {
    throw new Error(
      `${component} must be used within a Questionnaire.Root component.`
    )
  }
  return context
}

function useQuestionnaireItemContext(component: string) {
  const context = React.useContext(QuestionnaireItemContext)
  if (!context) {
    throw new Error(
      `${component} must be used within a Questionnaire.Item component.`
    )
  }
  return context
}

function useQuestionnaireChoiceContext(component: string) {
  const context = React.useContext(QuestionnaireChoiceContext)
  if (!context) {
    throw new Error(
      `${component} must be used within a Questionnaire.Choice component.`
    )
  }
  return context
}

// ── Utils ───────────────────────────────────────────────────────────────

function hasInputValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.some((item) => String(item).trim().length > 0)
  }
  return (
    value !== undefined && value !== null && String(value).trim().length > 0
  )
}

function getShortcutKeys(shortcuts: QuestionnaireShortcutMode | null) {
  if (shortcuts === "letters") {
    return Array.from({ length: 26 }, (_, index) =>
      String.fromCharCode(65 + index)
    )
  }
  if (shortcuts === "numbers") {
    return Array.from({ length: 9 }, (_, index) => String(index + 1))
  }
  return []
}

function getShortcutFromKey(key: string, shortcuts: QuestionnaireShortcutMode) {
  const normalizedKey =
    shortcuts === "letters" ? key.toUpperCase() : key
  return getShortcutKeys(shortcuts).includes(normalizedKey)
    ? normalizedKey
    : null
}

function getAnswerKeyShortcuts(
  shortcut: string | null,
  filled: boolean
) {
  return [shortcut, filled ? "Enter" : null].filter(Boolean).join(" ") || undefined
}

function isAnswerFilled(answer: AnswerControlRegistration) {
  if (answer.type === "choice") {
    return answer.element.checked
  }
  return (
    answer.element.hasAttribute("name") && hasInputValue(answer.element.value)
  )
}

function isEmptyNavigableInput(answer: AnswerControlRegistration | null) {
  return (
    answer?.type === "input" &&
    ["email", "password", "search", "tel", "text", "url"].includes(
      answer.element.type
    ) &&
    !hasInputValue(answer.element.value)
  )
}

function isTextEntryTarget(element: Element) {
  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    return true
  }
  if (element instanceof HTMLInputElement) {
    return !["button", "checkbox", "radio", "reset", "submit"].includes(
      element.type
    )
  }
  return element instanceof HTMLElement && element.isContentEditable
}

function isRadioTarget(element: Element) {
  return element instanceof HTMLInputElement && element.type === "radio"
}

function compareItemOrder(
  firstItem: ItemRegistration,
  secondItem: ItemRegistration
) {
  if (firstItem.element === secondItem.element) {
    return 0
  }
  const position = firstItem.element.compareDocumentPosition(
    secondItem.element
  )
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
    return -1
  }
  if (position & Node.DOCUMENT_POSITION_PRECEDING) {
    return 1
  }
  return 0
}

function compareAnswerOrder(
  firstAnswer: AnswerControlRegistration,
  secondAnswer: AnswerControlRegistration
) {
  if (firstAnswer.element === secondAnswer.element) {
    return 0
  }
  const position = firstAnswer.element.compareDocumentPosition(
    secondAnswer.element
  )
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
    return -1
  }
  if (position & Node.DOCUMENT_POSITION_PRECEDING) {
    return 1
  }
  return 0
}

function createQuestionnaireCollection(
  items: readonly QuestionnaireItemDefinition[] | undefined
) {
  if (items === undefined) {
    return null
  }
  return {
    enabledItems: items.filter((item) => !item.disabled),
    itemByName: new Map(items.map((item) => [item.name, item])),
    items,
  }
}

function getInitialItemName(
  collection: ReturnType<typeof createQuestionnaireCollection>,
  defaultItem: string | undefined
) {
  if (!collection) {
    return defaultItem ?? null
  }
  const defaultDefinition = defaultItem
    ? collection.itemByName.get(defaultItem)
    : undefined
  if (defaultDefinition && !defaultDefinition.disabled) {
    return defaultDefinition.name
  }
  return collection.enabledItems[0]?.name ?? null
}

function getShortcutByChoiceValue(
  item: QuestionnaireItemDefinition | undefined,
  shortcuts: QuestionnaireShortcutMode | null
) {
  const shortcutByChoiceValue = new Map<string, string>()
  if (!item || !shortcuts) {
    return shortcutByChoiceValue
  }
  const keys = getShortcutKeys(shortcuts)
  let shortcutIndex = 0
  for (const choice of item.choices ?? []) {
    if (choice.disabled) {
      continue
    }
    const shortcut = keys[shortcutIndex]
    if (!shortcut) {
      break
    }
    shortcutByChoiceValue.set(choice.value, shortcut)
    shortcutIndex += 1
  }
  return shortcutByChoiceValue
}

// ── Questionnaire Root ──────────────────────────────────────────────────

function Questionnaire({
  defaultItem,
  item: controlledItem,
  items: itemDefinitions,
  noValidate = true,
  onItemChange,
  onReset,
  onSubmit,
  className,
  shortcuts: shortcutMode,
  ...props
}: React.ComponentProps<"form"> & {
  defaultItem?: string
  item?: string
  items?: readonly QuestionnaireItemDefinition[]
  onItemChange?: (item: string) => void
  shortcuts?: QuestionnaireShortcutMode
}) {
  const collection = React.useMemo(
    () => createQuestionnaireCollection(itemDefinitions),
    [itemDefinitions]
  )
  const [registrations, setRegistrations] = React.useState<ItemRegistration[]>(
    []
  )
  const [uncontrolledItem, setUncontrolledItem] = React.useState<string | null>(
    () => getInitialItemName(collection, defaultItem)
  )
  const [rootElement, setRootElement] = React.useState<HTMLFormElement | null>(
    null
  )
  const [domVersion, setDomVersion] = React.useState(0)
  const pendingFocusRef = React.useRef<PendingFocus | null>(null)
  const controlled = controlledItem !== undefined
  const activeItemName = controlled ? controlledItem : uncontrolledItem
  const previousActiveItemNameRef = React.useRef(activeItemName)
  const nativeValidation = noValidate === false
  const shortcuts = shortcutMode ?? null

  React.useLayoutEffect(() => {
    if (!rootElement || typeof MutationObserver === "undefined") {
      return
    }
    const observer = new MutationObserver(() => {
      setDomVersion((version) => version + 1)
    })
    observer.observe(rootElement, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [rootElement])

  const runtimeItems = React.useMemo(
    () =>
      registrations
        .filter((registration) => !registration.disabled)
        .sort(compareItemOrder),
    [domVersion, registrations]
  )
  const runtimeItemByName = React.useMemo(
    () => new Map(runtimeItems.map((runtimeItem) => [runtimeItem.name, runtimeItem])),
    [runtimeItems]
  )
  const logicalItems = collection?.enabledItems ?? runtimeItems
  const currentIndex = logicalItems.findIndex(
    (logicalItem) => logicalItem.name === activeItemName
  )
  const activeItem =
    currentIndex < 0 || !activeItemName
      ? null
      : (runtimeItemByName.get(activeItemName) ?? null)
  const activeDefinition = activeItemName
    ? collection?.itemByName.get(activeItemName)
    : undefined
  const activeItemRequired =
    currentIndex < 0
      ? null
      : activeDefinition
        ? Boolean(activeDefinition.required)
        : (activeItem?.required ?? false)
  const activeItemStatus =
    currentIndex < 0
      ? null
      : (activeItem?.status ?? (activeItemName ? "unanswered" : null))
  const orderedRegistrations = React.useMemo(
    () =>
      collection
        ? collection.enabledItems.flatMap((definition) => {
            const registration = runtimeItemByName.get(definition.name)
            return registration ? [registration] : []
          })
        : runtimeItems,
    [collection, runtimeItemByName, runtimeItems]
  )
  const total = logicalItems.length
  const current = currentIndex < 0 ? 0 : currentIndex + 1
  const first = total > 0 && currentIndex === 0
  const last = total > 0 && currentIndex === total - 1

  const setItem = React.useCallback(
    (nextItem: string, focusTarget: PendingFocus["target"] = "item") => {
      if (nextItem === activeItemName) {
        return
      }
      pendingFocusRef.current = { name: nextItem, target: focusTarget }
      if (!controlled) {
        setUncontrolledItem(nextItem)
      }
      onItemChange?.(nextItem)
    },
    [activeItemName, controlled, onItemChange]
  )

  React.useLayoutEffect(() => {
    if (total === 0) {
      return
    }

    if (currentIndex < 0) {
      if (!controlled && activeItemName === null) {
        setUncontrolledItem(logicalItems[0].name)
        return
      }
      setItem(logicalItems[0].name)
      return
    }

    const pendingFocus = pendingFocusRef.current
    const activeItemChanged =
      previousActiveItemNameRef.current !== activeItemName

    previousActiveItemNameRef.current = activeItemName

    if (!pendingFocus || pendingFocus.name !== activeItemName) {
      if (controlled && activeItemChanged) {
        pendingFocusRef.current = null
        activeItem?.focus()
      }
      return
    }

    if (pendingFocus.target === "invalid") {
      activeItem?.focusInvalid()
    } else {
      activeItem?.focus()
    }
    pendingFocusRef.current = null
  }, [
    activeItem,
    activeItemName,
    controlled,
    currentIndex,
    logicalItems,
    setItem,
    total,
  ])

  const registerItem = React.useCallback(
    (registration: ItemRegistration) => {
      setRegistrations((currentRegistrations) => [
        ...currentRegistrations.filter(
          (currentRegistration) =>
            currentRegistration.element !== registration.element &&
            currentRegistration.name !== registration.name
        ),
        registration,
      ])
      return () => {
        setRegistrations((currentRegistrations) =>
          currentRegistrations.filter(
            (currentRegistration) => currentRegistration !== registration
          )
        )
      }
    },
    []
  )

  const goPrevious = React.useCallback(() => {
    if (currentIndex <= 0) {
      return
    }
    setItem(logicalItems[currentIndex - 1].name)
  }, [currentIndex, logicalItems, setItem])

  const goNext = React.useCallback(() => {
    if (!activeItem || currentIndex >= total - 1) {
      return
    }
    if (!activeItem.validate()) {
      activeItem.focusInvalid()
      return
    }
    setItem(logicalItems[currentIndex + 1].name)
  }, [activeItem, currentIndex, logicalItems, setItem, total])

  const confirmCurrent = React.useCallback(() => {
    if (!activeItem) {
      return
    }
    if (!activeItem.validate()) {
      activeItem.focusInvalid()
      return
    }
    if (last) {
      rootElement?.requestSubmit()
      return
    }
    setItem(logicalItems[currentIndex + 1].name)
  }, [activeItem, currentIndex, last, logicalItems, rootElement, setItem])

  const skipCurrent = React.useCallback(() => {
    if (!activeItem || activeItem.required) {
      return
    }
    activeItem.skip()
    if (!last) {
      setItem(logicalItems[currentIndex + 1].name)
      return
    }
    queueMicrotask(() => {
      rootElement?.requestSubmit()
    })
  }, [activeItem, currentIndex, last, logicalItems, rootElement, setItem])

  function handleReset(event: React.FormEvent<HTMLFormElement>) {
    onReset?.(event)
    if (event.defaultPrevented) {
      return
    }
    for (const registration of registrations) {
      registration.reset()
    }
    const resetItemName = collection
      ? getInitialItemName(collection, defaultItem)
      : (runtimeItems.find((registration) => registration.name === defaultItem)
          ?.name ?? runtimeItems[0]?.name)

    if (resetItemName) {
      setItem(resetItemName)
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const firstInvalidItem = orderedRegistrations.find(
      (registration) => !registration.validate()
    )

    if (firstInvalidItem) {
      event.preventDefault()
      setItem(firstInvalidItem.name, "invalid")

      if (firstInvalidItem.name === activeItemName) {
        firstInvalidItem.focusInvalid()
        pendingFocusRef.current = null
      }
      return
    }

    onSubmit?.(event)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (
      event.defaultPrevented ||
      event.nativeEvent.isComposing ||
      event.keyCode === 229 ||
      !activeItem ||
      !(event.target instanceof Element)
    ) {
      return
    }

    if (
      event.key === "Enter" &&
      (event.metaKey || event.ctrlKey) &&
      !event.altKey &&
      !event.shiftKey
    ) {
      event.preventDefault()
      if (!event.repeat) {
        confirmCurrent()
      }
      return
    }

    if (event.metaKey || event.ctrlKey || event.altKey) {
      return
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      const moved = activeItem.moveAnswerFocus(
        event.target,
        event.key === "ArrowDown" ? "next" : "previous"
      )
      if (moved) {
        event.preventDefault()
        return
      }
    }

    if (
      (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
      !isTextEntryTarget(event.target) &&
      !isRadioTarget(event.target)
    ) {
      event.preventDefault()
      if (event.repeat) {
        return
      }
      if (event.key === "ArrowLeft") {
        goPrevious()
      } else if (activeItem.status !== "unanswered") {
        goNext()
      }
      return
    }

    if (event.key === "Enter") {
      const answer = activeItem.getAnswerByElement(event.target)
      if (!answer) {
        return
      }
      event.preventDefault()
      if (!event.repeat && isAnswerFilled(answer)) {
        confirmCurrent()
      }
      return
    }

    if (!shortcuts || isTextEntryTarget(event.target)) {
      return
    }

    const shortcut = getShortcutFromKey(event.key, shortcuts)
    const answer = shortcut ? activeItem.getAnswerByShortcut(shortcut) : null

    if (!answer) {
      return
    }

    event.preventDefault()
    if (event.repeat) {
      return
    }

    answer.element.focus()
    if (answer.type === "choice") {
      answer.element.click()
    }
  }

  const state: QuestionnaireRootState = { current, first, last, total }
  const context = React.useMemo<QuestionnaireContextValue>(
    () => ({
      ...state,
      activeItem,
      activeItemName,
      activeItemRequired,
      activeItemStatus,
      domVersion,
      goNext,
      goPrevious,
      itemDefinitionByName: collection?.itemByName ?? null,
      nativeValidation,
      registerItem,
      shortcuts,
      skipCurrent,
    }),
    [
      activeItem,
      activeItemName,
      activeItemRequired,
      activeItemStatus,
      collection,
      current,
      domVersion,
      first,
      goNext,
      goPrevious,
      last,
      nativeValidation,
      registerItem,
      shortcuts,
      skipCurrent,
      total,
    ]
  )

  return (
    <QuestionnaireContext.Provider value={context}>
      <form
        ref={setRootElement}
        data-slot="questionnaire"
        data-shortcuts={shortcuts ?? undefined}
        noValidate={noValidate}
        onKeyDown={handleKeyDown}
        onReset={handleReset}
        onSubmit={handleSubmit}
        className={cn("flex w-full min-w-0 flex-col gap-4", className)}
        {...props}
      />
    </QuestionnaireContext.Provider>
  )
}

// ── Questionnaire.Progress ──────────────────────────────────────────────

function QuestionnaireProgress({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { current, total } = useQuestionnaireContext("Questionnaire.Progress")
  const label = total ? `Question ${current} of ${total}` : undefined

  return (
    <div
      data-slot="questionnaire-progress"
      aria-label="Questionnaire progress"
      aria-live="polite"
      aria-valuemax={total || undefined}
      aria-valuemin={total ? 1 : undefined}
      aria-valuenow={total ? current : undefined}
      aria-valuetext={label}
      role="progressbar"
      className={cn(
        "min-h-[1lh] w-fit min-w-[14ch] text-xs font-medium text-muted-foreground tabular-nums",
        className
      )}
      {...props}
    >
      {children ?? label}
    </div>
  )
}

// ── Questionnaire.Item ──────────────────────────────────────────────────

function QuestionnaireItem({
  "aria-describedby": ariaDescribedBy,
  "aria-keyshortcuts": ariaKeyShortcuts,
  className,
  disabled = false,
  invalid: externallyInvalid = false,
  multiple = false,
  name,
  onStatusChange,
  required = false,
  ...props
}: React.ComponentProps<"fieldset"> & {
  invalid?: boolean
  name: string
  multiple?: boolean
  onStatusChange?: (status: QuestionnaireItemStatus) => void
  required?: boolean
}) {
  const {
    activeItemName,
    domVersion,
    first,
    itemDefinitionByName,
    last,
    nativeValidation,
    registerItem,
    shortcuts,
  } = useQuestionnaireContext("Questionnaire.Item")
  const [element, setElement] = React.useState<HTMLFieldSetElement | null>(null)
  const [answerControlRegistrations, setAnswerControlRegistrations] =
    React.useState<AnswerControlRegistration[]>([])
  const [validationAttempted, setValidationAttempted] = React.useState(false)
  const [selectedAnswerIds, setSelectedAnswerIds] = React.useState<string[]>([])
  const [skipped, setSkipped] = React.useState(false)
  const [resetVersion, setResetVersion] = React.useState(0)
  const [descriptionIds, setDescriptionIds] = React.useState<string[]>([])
  const [errorIds, setErrorIds] = React.useState<string[]>([])
  const defaultSelectedAnswerIdsRef = React.useRef<string[]>([])
  const multipleRef = React.useRef(multiple)
  const previousMultipleRef = React.useRef(multiple)
  multipleRef.current = multiple
  const active = !disabled && activeItemName === name
  const answerControls = React.useMemo(
    () => [...answerControlRegistrations].sort(compareAnswerOrder),
    [answerControlRegistrations, domVersion]
  )
  const answers = React.useMemo(
    () => answerControls.filter((registration) => !registration.disabled),
    [answerControls]
  )
  const answered = answers.some((answer) =>
    selectedAnswerIds.includes(answer.id)
  )
  const status: QuestionnaireItemStatus = skipped
    ? "skipped"
    : answered
      ? "answered"
      : "unanswered"
  const intentionallySkipped = status === "skipped" && !required
  const valid =
    disabled ||
    intentionallySkipped ||
    (!externallyInvalid && status === "answered")
  const invalid =
    !disabled &&
    !intentionallySkipped &&
    (externallyInvalid || (validationAttempted && !valid))
  const hasInputAnswer = answers.some((answer) => answer.type === "input")
  const previousStatusRef = React.useRef(status)
  const itemDefinition = itemDefinitionByName?.get(name)
  const shortcutByChoiceValue = React.useMemo(
    () =>
      itemDefinitionByName
        ? getShortcutByChoiceValue(itemDefinitionByName.get(name), shortcuts)
        : null,
    [itemDefinitionByName, name, shortcuts]
  )
  const shortcutByAnswerId = React.useMemo(() => {
    if (shortcutByChoiceValue) {
      return new Map<string, string>()
    }
    const keys = getShortcutKeys(shortcuts)
    const shortcutAnswers = answers.filter((answer) => answer.type === "choice")
    return new Map(
      shortcutAnswers
        .slice(0, keys.length)
        .map((answer, index) => [answer.id, keys[index]])
    )
  }, [answers, shortcutByChoiceValue, shortcuts])

  const registerAnswerControl = React.useCallback(
    (registration: AnswerControlRegistration) => {
      setAnswerControlRegistrations((currentRegistrations) => [
        ...currentRegistrations.filter(
          (currentRegistration) =>
            currentRegistration.element !== registration.element &&
            currentRegistration.id !== registration.id
        ),
        registration,
      ])
      return () => {
        setAnswerControlRegistrations((currentRegistrations) =>
          currentRegistrations.filter(
            (currentRegistration) => currentRegistration !== registration
          )
        )
      }
    },
    []
  )

  React.useLayoutEffect(() => {
    if (previousStatusRef.current === status) {
      return
    }
    previousStatusRef.current = status
    onStatusChange?.(status)
  }, [onStatusChange, status])

  const updateAnswerSelected = React.useCallback(
    (answerId: string, selected: boolean) => {
      setSelectedAnswerIds((currentAnswerIds) => {
        if (!selected) {
          return currentAnswerIds.filter(
            (currentAnswerId) => currentAnswerId !== answerId
          )
        }
        if (!multiple) {
          return [answerId]
        }
        return currentAnswerIds.includes(answerId)
          ? currentAnswerIds
          : [...currentAnswerIds, answerId]
      })
    },
    [multiple]
  )

  const setAnswerSelectionFromInteraction = React.useCallback(
    (answerId: string, selected: boolean) => {
      setSkipped(false)
      updateAnswerSelected(answerId, selected)
    },
    [updateAnswerSelected]
  )

  const syncControlledAnswerSelection = React.useCallback(
    (answerId: string, selected: boolean) => {
      if (selected) {
        setSkipped(false)
      }
      updateAnswerSelected(answerId, selected)
    },
    [updateAnswerSelected]
  )

  const registerAnswerSelection = React.useCallback(
    (answerId: string, defaultSelected: boolean) => {
      if (defaultSelected) {
        defaultSelectedAnswerIdsRef.current = [
          ...defaultSelectedAnswerIdsRef.current.filter(
            (currentAnswerId) => currentAnswerId !== answerId
          ),
          answerId,
        ]
        setSelectedAnswerIds((currentAnswerIds) => {
          if (!multipleRef.current) {
            return currentAnswerIds.length ? currentAnswerIds : [answerId]
          }
          return currentAnswerIds.includes(answerId)
            ? currentAnswerIds
            : [...currentAnswerIds, answerId]
        })
      }

      return () => {
        defaultSelectedAnswerIdsRef.current =
          defaultSelectedAnswerIdsRef.current.filter(
            (currentAnswerId) => currentAnswerId !== answerId
          )
        setSelectedAnswerIds((currentAnswerIds) =>
          currentAnswerIds.filter(
            (currentAnswerId) => currentAnswerId !== answerId
          )
        )
      }
    },
    []
  )

  const setAnswerDefault = React.useCallback(
    (answerId: string, defaultSelected: boolean) => {
      if (defaultSelected) {
        defaultSelectedAnswerIdsRef.current =
          defaultSelectedAnswerIdsRef.current.includes(answerId)
            ? defaultSelectedAnswerIdsRef.current
            : [...defaultSelectedAnswerIdsRef.current, answerId]
        return
      }
      defaultSelectedAnswerIdsRef.current =
        defaultSelectedAnswerIdsRef.current.filter(
          (currentAnswerId) => currentAnswerId !== answerId
        )
    },
    []
  )

  const registerDescription = React.useCallback(
    (registeredDescriptionId: string) => {
      setDescriptionIds((currentDescriptionIds) =>
        currentDescriptionIds.includes(registeredDescriptionId)
          ? currentDescriptionIds
          : [...currentDescriptionIds, registeredDescriptionId]
      )
      return () => {
        setDescriptionIds((currentDescriptionIds) =>
          currentDescriptionIds.filter(
            (currentDescriptionId) =>
              currentDescriptionId !== registeredDescriptionId
          )
        )
      }
    },
    []
  )

  const registerError = React.useCallback((registeredErrorId: string) => {
    setErrorIds((currentErrorIds) =>
      currentErrorIds.includes(registeredErrorId)
        ? currentErrorIds
        : [...currentErrorIds, registeredErrorId]
    )
    return () => {
      setErrorIds((currentErrorIds) =>
        currentErrorIds.filter(
          (currentErrorId) => currentErrorId !== registeredErrorId
        )
      )
    }
  }, [])

  const validate = React.useCallback(() => {
    setValidationAttempted(true)
    if (!valid) {
      return false
    }
    if (!nativeValidation) {
      return true
    }
    const invalidAnswer = answers.find(
      (answer) =>
        isAnswerFilled(answer) &&
        answer.element.willValidate &&
        !answer.element.validity.valid
    )
    if (!invalidAnswer) {
      return true
    }
    invalidAnswer.element.focus()
    invalidAnswer.element.reportValidity()
    return false
  }, [answers, nativeValidation, valid])

  const focus = React.useCallback(() => {
    element?.focus()
  }, [element])

  const focusInvalid = React.useCallback(() => {
    const selectedInput = element?.querySelector<HTMLInputElement>(
      "input[data-filled][name]:not(:disabled)"
    )
    const firstControl = element?.querySelector<HTMLElement>(
      "input:not([type=hidden]):not(:disabled), textarea:not(:disabled)"
    )
    ;(selectedInput ?? firstControl ?? element)?.focus()
  }, [element])

  const reset = React.useCallback(() => {
    setValidationAttempted(false)
    setSkipped(false)
    setSelectedAnswerIds(
      multiple
        ? [...defaultSelectedAnswerIdsRef.current]
        : defaultSelectedAnswerIdsRef.current.slice(0, 1)
    )
    setResetVersion((version) => version + 1)
  }, [multiple])

  const skip = React.useCallback(() => {
    if (required) {
      return
    }
    setSelectedAnswerIds([])
    setSkipped(true)
  }, [required])

  React.useLayoutEffect(() => {
    const wasMultiple = previousMultipleRef.current
    previousMultipleRef.current = multiple
    if (!wasMultiple || multiple) {
      return
    }
    setSelectedAnswerIds((currentAnswerIds) => {
      const selectedAnswer = answers.find((answer) =>
        currentAnswerIds.includes(answer.id)
      )
      return selectedAnswer ? [selectedAnswer.id] : []
    })
  }, [answers, multiple])

  const getAnswerByElement = React.useCallback(
    (answerElement: Element) =>
      answers.find((answer) => answer.element === answerElement) ?? null,
    [answers]
  )

  const getAnswerByShortcut = React.useCallback(
    (shortcut: string) => {
      if (shortcutByChoiceValue) {
        const choiceValue = Array.from(shortcutByChoiceValue.entries()).find(
          ([, choiceShortcut]) => choiceShortcut === shortcut
        )?.[0]
        return (
          answers.find(
            (answer) => answer.type === "choice" && answer.value === choiceValue
          ) ?? null
        )
      }
      const answerId = Array.from(shortcutByAnswerId.entries()).find(
        ([, answerShortcut]) => answerShortcut === shortcut
      )?.[0]
      return answers.find((answer) => answer.id === answerId) ?? null
    },
    [answers, shortcutByAnswerId, shortcutByChoiceValue]
  )

  const moveAnswerFocus = React.useCallback(
    (currentElement: Element, direction: "next" | "previous") => {
      const currentIndex = answers.findIndex(
        (answer) => answer.element === currentElement
      )
      const currentAnswer =
        currentIndex < 0 ? null : (answers[currentIndex] ?? null)

      if (
        !answers.length ||
        (isTextEntryTarget(currentElement) &&
          !isEmptyNavigableInput(currentAnswer)) ||
        (currentIndex < 0 && currentElement !== element)
      ) {
        return false
      }

      const nextAnswer =
        currentIndex < 0
          ? (answers.find(isAnswerFilled) ??
            (direction === "next" ? answers[0] : answers[answers.length - 1]))
          : answers[
              (currentIndex +
                (direction === "next" ? 1 : -1) +
                answers.length) %
                answers.length
            ]

      if (!nextAnswer || nextAnswer.element === currentElement) {
        return false
      }

      if (
        currentIndex >= 0 &&
        isRadioTarget(currentElement) &&
        isRadioTarget(nextAnswer.element)
      ) {
        return false
      }

      nextAnswer.element.focus()
      if (nextAnswer.type === "choice" && isRadioTarget(nextAnswer.element)) {
        nextAnswer.element.click()
      }
      return true
    },
    [answers, element]
  )

  React.useLayoutEffect(() => {
    if (!element) {
      return
    }

    return registerItem({
      choices: answerControls.flatMap((answer) =>
        answer.type === "choice"
          ? [{ disabled: answer.ownDisabled, value: answer.value }]
          : []
      ),
      disabled,
      element,
      focus,
      focusInvalid,
      getAnswerByElement,
      getAnswerByShortcut,
      moveAnswerFocus,
      name,
      required,
      reset,
      skip,
      status,
      validate,
    })
  }, [
    answerControls,
    disabled,
    element,
    focus,
    focusInvalid,
    getAnswerByElement,
    getAnswerByShortcut,
    moveAnswerFocus,
    name,
    registerItem,
    required,
    reset,
    skip,
    status,
    validate,
  ])

  const context = React.useMemo<QuestionnaireItemContextValue>(
    () => ({
      active,
      disabled,
      hasInputAnswer,
      invalid,
      multiple,
      name,
      registerAnswerControl,
      registerAnswerSelection,
      registerDescription,
      registerError,
      required,
      resetVersion,
      selectedAnswerIds,
      setAnswerDefault,
      setAnswerSelectionFromInteraction,
      shortcutByAnswerId,
      shortcutByChoiceValue,
      shortcuts,
      status,
      syncControlledAnswerSelection,
    }),
    [
      active,
      disabled,
      hasInputAnswer,
      invalid,
      multiple,
      name,
      registerAnswerControl,
      registerAnswerSelection,
      registerDescription,
      registerError,
      required,
      resetVersion,
      selectedAnswerIds,
      setAnswerDefault,
      setAnswerSelectionFromInteraction,
      shortcutByAnswerId,
      shortcutByChoiceValue,
      shortcuts,
      status,
      syncControlledAnswerSelection,
    ]
  )

  const describedBy =
    [...descriptionIds, ...(invalid ? errorIds : []), ariaDescribedBy]
      .filter(Boolean)
      .join(" ") || undefined
  const keyShortcuts =
    [
      ariaKeyShortcuts,
      active ? "Meta+Enter Control+Enter" : undefined,
      active && answers.length ? "ArrowUp ArrowDown" : undefined,
      active && !first ? "ArrowLeft" : undefined,
      active && !last && status !== "unanswered" ? "ArrowRight" : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined

  return (
    <QuestionnaireItemContext.Provider value={context}>
      <fieldset
        ref={setElement}
        data-slot="questionnaire-item"
        data-active={active ? "" : undefined}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        aria-keyshortcuts={keyShortcuts}
        disabled={disabled}
        hidden={!active}
        {...(!active ? { inert: true } : {})}
        tabIndex={-1}
        className={cn(
          "flex min-w-0 flex-col gap-4 border-0 p-0 outline-none",
          className
        )}
        {...props}
      />
    </QuestionnaireItemContext.Provider>
  )
}

// ── Questionnaire.Title / Description ───────────────────────────────────

function QuestionnaireTitle({
  className,
  ...props
}: React.ComponentProps<"legend">) {
  useQuestionnaireItemContext("Questionnaire.Title")

  return (
    <legend
      data-slot="questionnaire-title"
      className={cn(
        "font-heading text-base leading-snug font-medium text-pretty [&:not(:has(~[data-slot=questionnaire-description]))]:mb-4",
        className
      )}
      {...props}
    />
  )
}

function QuestionnaireDescription({
  className,
  id,
  ...props
}: React.ComponentProps<"p">) {
  const { registerDescription } = useQuestionnaireItemContext(
    "Questionnaire.Description"
  )
  const generatedId = React.useId()
  const descriptionId = id ?? generatedId

  React.useLayoutEffect(
    () => registerDescription(descriptionId),
    [descriptionId, registerDescription]
  )

  return (
    <p
      data-slot="questionnaire-description"
      id={descriptionId}
      className={cn("text-sm text-pretty text-muted-foreground", className)}
      {...props}
    />
  )
}

// ── Questionnaire.Choices / Choice ──────────────────────────────────────

function QuestionnaireChoices({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { shortcuts } = useQuestionnaireItemContext("Questionnaire.Choices")

  return (
    <div
      data-slot="questionnaire-choices"
      data-shortcuts={shortcuts ?? undefined}
      className={cn("group/questionnaire-choices grid min-w-0 gap-2", className)}
      {...props}
    />
  )
}

function QuestionnaireChoice({
  checked: controlledChecked,
  className,
  children,
  defaultChecked = false,
  disabled: choiceDisabled = false,
  onChange,
  value,
  ...props
}: React.ComponentProps<"label"> & {
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  value: string
}) {
  const {
    disabled: itemDisabled,
    hasInputAnswer,
    invalid,
    multiple,
    name: itemName,
    registerAnswerControl,
    registerAnswerSelection,
    required,
    resetVersion,
    selectedAnswerIds,
    setAnswerDefault,
    setAnswerSelectionFromInteraction,
    shortcutByAnswerId,
    shortcutByChoiceValue,
    status,
    syncControlledAnswerSelection,
  } = useQuestionnaireItemContext("Questionnaire.Choice")
  const answerId = React.useId()
  const [inputElement, setInputElement] =
    React.useState<HTMLInputElement | null>(null)
  const initialDefaultCheckedRef = React.useRef(defaultChecked)
  const controlled = controlledChecked !== undefined
  const disabled = itemDisabled || choiceDisabled
  const selected = selectedAnswerIds.includes(answerId)
  const checked = controlled
    ? status === "skipped"
      ? false
      : controlledChecked
    : selected
  const type = multiple ? "checkbox" : "radio"
  const shortcut =
    shortcutByChoiceValue?.get(value) ??
    shortcutByAnswerId.get(answerId) ??
    null

  React.useLayoutEffect(
    () => registerAnswerSelection(answerId, initialDefaultCheckedRef.current),
    [answerId, registerAnswerSelection]
  )
  React.useLayoutEffect(
    () => setAnswerDefault(answerId, defaultChecked),
    [answerId, defaultChecked, setAnswerDefault]
  )

  React.useLayoutEffect(() => {
    if (!inputElement) {
      return
    }
    return registerAnswerControl({
      disabled,
      element: inputElement,
      id: answerId,
      ownDisabled: choiceDisabled,
      type: "choice",
      value,
    })
  }, [
    answerId,
    choiceDisabled,
    disabled,
    inputElement,
    registerAnswerControl,
    value,
  ])

  React.useLayoutEffect(() => {
    if (controlled) {
      syncControlledAnswerSelection(answerId, controlledChecked)
    }
  }, [
    answerId,
    controlled,
    controlledChecked,
    resetVersion,
    syncControlledAnswerSelection,
  ])

  React.useLayoutEffect(() => {
    if (!inputElement) {
      return
    }
    inputElement.defaultChecked = controlled
      ? controlledChecked
      : defaultChecked
    if (resetVersion > 0) {
      inputElement.checked = checked
    }
  }, [
    checked,
    controlled,
    controlledChecked,
    defaultChecked,
    inputElement,
    resetVersion,
  ])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChange?.(event)
    if (event.defaultPrevented) {
      return
    }
    if (!controlled) {
      setAnswerSelectionFromInteraction(answerId, event.target.checked)
      return
    }
    if (status === "skipped" && controlledChecked === event.target.checked) {
      setAnswerSelectionFromInteraction(answerId, controlledChecked)
    }
  }

  const state: QuestionnaireChoiceState = {
    checked,
    disabled,
    invalid,
    shortcut,
    type,
  }

  const inputProps: React.ComponentPropsWithRef<"input"> = {
    ref: setInputElement,
    "aria-invalid": invalid || undefined,
    "aria-keyshortcuts": getAnswerKeyShortcuts(
      shortcut,
      !disabled && checked
    ),
    checked,
    disabled,
    id: answerId,
    name: status === "skipped" ? undefined : itemName,
    onChange: handleChange,
    required: required && !multiple && !hasInputAnswer,
    type,
    value,
  }

  return (
    <QuestionnaireChoiceContext.Provider value={{ inputProps, state }}>
      <label
        data-slot="questionnaire-choice"
        data-type={type}
        data-checked={checked ? "" : undefined}
        data-unchecked={checked ? undefined : ""}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-shortcut={shortcut ?? undefined}
        className={cn(
          "group/questionnaire-choice relative flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg border border-input bg-transparent px-3 py-2.5 text-start text-sm transition-colors outline-none select-none hover:bg-muted/50 has-[>input:focus-visible]:border-ring has-[>input:focus-visible]:ring-3 has-[>input:focus-visible]:ring-ring/50 data-invalid:border-destructive dark:bg-input/20 data-checked:border-primary/40 data-checked:bg-muted dark:data-checked:bg-muted",
          "data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
          className
        )}
        {...props}
      >
        <QuestionnaireChoiceInput />
        <span
          aria-hidden="true"
          data-slot="questionnaire-choice-indicator"
          className="pointer-events-none relative flex size-4 shrink-0 translate-y-[--spacing(0.45)] items-center justify-center rounded-[4px] border border-input group-has-data-[slot=questionnaire-choice-description]/questionnaire-choice:translate-y-0.5 group-data-[type=radio]/questionnaire-choice:rounded-full group-data-checked/questionnaire-choice:border-primary group-data-checked/questionnaire-choice:bg-primary group-data-checked/questionnaire-choice:text-primary-foreground dark:bg-input/30 dark:group-data-checked/questionnaire-choice:bg-primary"
        >
          <span
            data-slot="questionnaire-choice-indicator-dot"
            className="hidden size-2 rounded-full bg-primary-foreground group-data-[type=checkbox]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block"
          />
          <CheckIcon
            data-slot="questionnaire-choice-indicator-check"
            className="hidden size-3.5 group-data-[type=radio]/questionnaire-choice:hidden group-data-checked/questionnaire-choice:block"
          />
        </span>
        <QuestionnaireChoiceLabel>
          {children}
        </QuestionnaireChoiceLabel>
        <QuestionnaireChoiceShortcut />
      </label>
    </QuestionnaireChoiceContext.Provider>
  )
}

function QuestionnaireChoiceInput({ ...props }: React.ComponentProps<"input">) {
  const { inputProps, state } = useQuestionnaireChoiceContext(
    "Questionnaire.ChoiceInput"
  )

  return (
    <input
      data-slot="questionnaire-choice-input"
      data-checked={state.checked ? "" : undefined}
      data-unchecked={state.checked ? undefined : ""}
      {...inputProps}
      {...props}
      className={cn(
        "absolute inset-0 z-10 size-full cursor-pointer opacity-0",
        props.className
      )}
    />
  )
}

function QuestionnaireChoiceLabel({
  className,
  ...props
}: React.ComponentProps<"span">) {
  useQuestionnaireChoiceContext("Questionnaire.ChoiceLabel")

  return (
    <span
      data-slot="questionnaire-choice-label"
      className={cn("flex min-w-0 flex-1 flex-col gap-0.5 leading-snug", className)}
      {...props}
    />
  )
}

function QuestionnaireChoiceDescription({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="questionnaire-choice-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  )
}

function QuestionnaireChoiceShortcut({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  const { state } = useQuestionnaireChoiceContext(
    "Questionnaire.ChoiceShortcut"
  )

  return (
    <span
      data-slot="questionnaire-choice-shortcut"
      aria-hidden="true"
      hidden={state.shortcut === null}
      className={cn(
        "pointer-events-none ms-auto hidden size-5 shrink-0 translate-y-[--spacing(0.45)] items-center justify-center rounded-md border border-input bg-background font-mono text-[0.625rem] leading-none font-medium text-muted-foreground group-has-data-[slot=questionnaire-choice-description]/questionnaire-choice:translate-y-0.5 group-data-[shortcut]/questionnaire-choice:inline-flex",
        className
      )}
      {...props}
    >
      {children ?? state.shortcut}
    </span>
  )
}

// ── Questionnaire.Input / Error ─────────────────────────────────────────

function QuestionnaireInput({
  defaultValue,
  className,
  disabled: inputDisabled = false,
  onChange,
  type = "text",
  value: controlledValue,
  ...props
}: React.ComponentProps<"input"> & { type?: QuestionnaireInputType }) {
  const {
    disabled: itemDisabled,
    invalid,
    name: itemName,
    registerAnswerControl,
    registerAnswerSelection,
    resetVersion,
    selectedAnswerIds,
    setAnswerDefault,
    setAnswerSelectionFromInteraction,
    syncControlledAnswerSelection,
  } = useQuestionnaireItemContext("Questionnaire.Input")
  const answerId = React.useId()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const initialDefaultFilledRef = React.useRef(hasInputValue(defaultValue))
  const controlled = controlledValue !== undefined
  const defaultFilled = hasInputValue(defaultValue)
  const controlledFilled = hasInputValue(controlledValue)
  const [uncontrolledFilled, setUncontrolledFilled] =
    React.useState(defaultFilled)
  const disabled = itemDisabled || inputDisabled
  const filled = controlled ? controlledFilled : uncontrolledFilled
  const selected = selectedAnswerIds.includes(answerId)

  React.useLayoutEffect(
    () => registerAnswerSelection(answerId, initialDefaultFilledRef.current),
    [answerId, registerAnswerSelection]
  )
  React.useLayoutEffect(
    () => setAnswerDefault(answerId, defaultFilled),
    [defaultFilled, answerId, setAnswerDefault]
  )

  React.useLayoutEffect(() => {
    const input = inputRef.current
    if (!input) {
      return
    }
    return registerAnswerControl({
      disabled,
      element: input,
      id: answerId,
      type: "input",
    })
  }, [disabled, answerId, registerAnswerControl])

  React.useLayoutEffect(() => {
    if (controlled) {
      syncControlledAnswerSelection(answerId, controlledFilled)
      return
    }
    if (resetVersion > 0) {
      setUncontrolledFilled(defaultFilled)
    }
  }, [
    controlled,
    controlledFilled,
    controlledValue,
    defaultFilled,
    answerId,
    resetVersion,
    syncControlledAnswerSelection,
  ])

  React.useLayoutEffect(() => {
    const input = inputRef.current
    if (!input || !controlled) {
      return
    }
    input.defaultValue = String(controlledValue)
  }, [controlled, controlledValue])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChange?.(event)
    if (event.defaultPrevented) {
      return
    }
    const nextFilled = event.target.value.trim().length > 0
    if (controlled) {
      return
    }
    setUncontrolledFilled(nextFilled)
    setAnswerSelectionFromInteraction(answerId, nextFilled)
  }

  return (
    <div
      data-slot="questionnaire-input-wrapper"
      className="group/questionnaire-input relative w-full min-w-0"
    >
      <input
        ref={inputRef}
        data-slot="questionnaire-input"
        data-empty={filled ? undefined : ""}
        data-filled={filled ? "" : undefined}
        aria-invalid={invalid || undefined}
        aria-keyshortcuts={getAnswerKeyShortcuts(
          null,
          !disabled && filled && selected
        )}
        defaultValue={controlled ? undefined : defaultValue}
        disabled={disabled}
        form={selected ? undefined : ""}
        id={answerId}
        name={selected ? itemName : undefined}
        onChange={handleChange}
        type={type}
        value={controlled ? controlledValue : undefined}
        className={cn(
          "h-8 min-h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-[color,box-shadow,background-color] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 sm:min-h-0 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          "selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground",
          className
        )}
        {...props}
      />
    </div>
  )
}

function QuestionnaireError({
  className,
  children,
  id,
  ...props
}: React.ComponentProps<"p">) {
  const { invalid, registerError, required } = useQuestionnaireItemContext(
    "Questionnaire.Error"
  )
  const generatedId = React.useId()
  const errorId = id ?? generatedId

  React.useLayoutEffect(() => registerError(errorId), [errorId, registerError])

  return (
    <p
      data-slot="questionnaire-error"
      data-invalid={invalid || undefined}
      hidden={!invalid}
      role={invalid ? "alert" : undefined}
      id={errorId}
      className={cn("mt-2 text-sm text-destructive", className)}
      {...props}
    >
      {children ??
        (required
          ? "Choose an answer to continue."
          : "Choose an answer or skip this question.")}
    </p>
  )
}

// ── Questionnaire.Actions / Navigation ──────────────────────────────────

function QuestionnaireActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="questionnaire-actions"
      className={cn(
        "grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:min-h-8",
        className
      )}
      {...props}
    />
  )
}

function useRenderNavigationButton({
  children,
  disabled,
  onClick,
  props,
  shortcut,
  status,
  type,
  visible,
}: {
  children: React.ReactNode
  disabled: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  props: React.ComponentProps<"button">
  shortcut?: "Enter"
  status: QuestionnaireItemStatus | null
  type: "button" | "reset" | "submit"
  visible: boolean
}) {
  const activeShortcut = visible && !disabled ? (shortcut ?? null) : null
  const state = {
    disabled,
    shortcut: activeShortcut,
    status,
    visible,
  }

  return {
    "aria-hidden": !visible || undefined,
    "aria-keyshortcuts": activeShortcut ?? undefined,
    children,
    disabled,
    hidden: !visible,
    ...(!visible ? { inert: true } : {}),
    onClick,
    tabIndex: visible ? undefined : -1,
    type,
    "data-hidden": visible ? undefined : "",
    "data-visible": visible ? "" : undefined,
    "data-status": state.status ?? undefined,
    ...props,
  }
}

function QuestionnairePrevious({
  children,
  className,
  disabled: disabledProp = false,
  onClick,
  size = "default",
  variant = "outline",
  ...props
}: React.ComponentProps<"button"> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  const context = useQuestionnaireContext("Questionnaire.Previous")
  const visible = context.total > 1 && !context.first

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event)
    if (!event.defaultPrevented) {
      context.goPrevious()
    }
  }

  return (
    <button
      data-slot="questionnaire-previous"
      data-size={size}
      data-variant={variant}
      {...useRenderNavigationButton({
        children: children ?? "Previous",
        disabled: disabledProp,
        onClick: handleClick,
        props,
        status: context.activeItemStatus,
        type: "button",
        visible,
      })}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-1 row-start-1 min-h-11 justify-self-start sm:min-h-0",
        className
      )}
    />
  )
}

function QuestionnaireSkip({
  children,
  className,
  disabled: disabledProp = false,
  onClick,
  size = "default",
  variant = "outline",
  ...props
}: React.ComponentProps<"button"> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  const context = useQuestionnaireContext("Questionnaire.Skip")
  const visible = context.activeItemRequired === false

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event)
    if (!event.defaultPrevented) {
      context.skipCurrent()
    }
  }

  return (
    <button
      data-slot="questionnaire-skip"
      data-size={size}
      data-variant={variant}
      {...useRenderNavigationButton({
        children: children ?? "Skip",
        disabled: disabledProp,
        onClick: handleClick,
        props,
        status: context.activeItemStatus,
        type: "button",
        visible,
      })}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-2 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className
      )}
    />
  )
}

function QuestionnaireNext({
  children,
  className,
  disabled: disabledProp = false,
  onClick,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<"button"> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  const context = useQuestionnaireContext("Questionnaire.Next")
  const visible = context.total > 1 && !context.last

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event)
    if (!event.defaultPrevented) {
      context.goNext()
    }
  }

  return (
    <button
      data-slot="questionnaire-next"
      data-size={size}
      data-variant={variant}
      {...useRenderNavigationButton({
        children: children ?? "Next",
        disabled: disabledProp,
        onClick: handleClick,
        props,
        shortcut: "Enter",
        status: context.activeItemStatus,
        type: "button",
        visible,
      })}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className
      )}
    />
  )
}

function QuestionnaireSubmit({
  children,
  className,
  disabled: disabledProp = false,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<"button"> &
  Pick<React.ComponentProps<typeof Button>, "size" | "variant">) {
  const context = useQuestionnaireContext("Questionnaire.Submit")
  const visible = context.total > 0 && context.last

  return (
    <button
      data-slot="questionnaire-submit"
      data-size={size}
      data-variant={variant}
      {...useRenderNavigationButton({
        children: children ?? "Submit",
        disabled: disabledProp,
        props,
        shortcut: "Enter",
        status: context.activeItemStatus,
        type: "submit",
        visible,
      })}
      className={cn(
        buttonVariants({ size, variant }),
        "col-start-3 row-start-1 min-h-11 justify-self-end sm:min-h-0",
        className
      )}
    />
  )
}

export {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
}
export type {
  QuestionnaireItemStatus,
  QuestionnaireShortcutMode,
}
