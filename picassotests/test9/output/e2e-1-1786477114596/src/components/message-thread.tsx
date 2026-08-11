"use client"

import * as React from "react"

import { cn } from "./cn"
import { Button } from "./button"
import { ArrowDownIcon } from "lucide-react"

type MessageScrollerMode =
  | "following-bottom"
  | "free-scrolling"
  | "anchored-to-message"
  | "settling-jump"

type MessageScrollerScrollable = { start: boolean; end: boolean }
type MessageScrollerVisibilityState = {
  currentAnchorId: string | null
  visibleMessageIds: string[]
}
type MessageScrollerScrollOptions = {
  behavior?: ScrollBehavior
  align?: "start" | "center" | "end" | "nearest"
  scrollMargin?: number
}
type MessageScrollerDefaultScrollPosition = "start" | "end" | "last-anchor"

const SCROLL_POSITION_EPSILON = 0.1
const AUTOSCROLLING_CLEAR_DELAY = 400
const DEFAULT_SCROLL_EDGE_THRESHOLD = 32
const DEFAULT_SCROLL_MARGIN = 24
const DEFAULT_SCROLL_PREVIOUS_ITEM_PEEK = 40
const EMPTY_MESSAGE_SCROLLER_SCROLLABLE: MessageScrollerScrollable = {
  start: false,
  end: false,
}
const EMPTY_MESSAGE_SCROLLER_VISIBILITY_STATE: MessageScrollerVisibilityState =
  { currentAnchorId: null, visibleMessageIds: [] }
const USER_SCROLL_KEYS = new Set([
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
  " ",
])

// ── External stores ─────────────────────────────────────────────────────

function createExternalStore<T>(
  initialSnapshot: T,
  isEqual: (a: T, b: T) => boolean
) {
  let snapshot = initialSnapshot
  const listeners = new Set<() => void>()

  return {
    getSnapshot: () => snapshot,
    hasListeners: () => listeners.size > 0,
    setSnapshot: (nextSnapshot: T) => {
      if (isEqual(snapshot, nextSnapshot)) {
        return
      }
      snapshot = nextSnapshot
      listeners.forEach((listener) => listener())
    },
    subscribe: (
      listener: () => void,
      onFirstSubscribe?: () => void,
      onLastUnsubscribe?: () => void
    ) => {
      const wasEmpty = listeners.size === 0
      listeners.add(listener)
      if (wasEmpty) {
        onFirstSubscribe?.()
      }
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0) {
          onLastUnsubscribe?.()
        }
      }
    },
  }
}

function areScrollStatesEqual(
  current: MessageScrollerScrollable,
  next: MessageScrollerScrollable
) {
  return current.start === next.start && current.end === next.end
}

function areVisibilityStatesEqual(
  current: MessageScrollerVisibilityState,
  next: MessageScrollerVisibilityState
) {
  if (current.currentAnchorId !== next.currentAnchorId) {
    return false
  }
  if (current.visibleMessageIds.length !== next.visibleMessageIds.length) {
    return false
  }
  return current.visibleMessageIds.every(
    (messageId, index) => messageId === next.visibleMessageIds[index]
  )
}

// ── Geometry ────────────────────────────────────────────────────────────

function getMessageScrollerItems(content: HTMLElement, spacer: HTMLElement | null) {
  return Array.from(content.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && child !== spacer
  )
}

function getContentBottom({
  content,
  spacer,
  viewport,
}: {
  content: HTMLElement
  spacer: HTMLElement | null
  viewport: HTMLElement
}) {
  const items = getMessageScrollerItems(content, spacer)
  const padding = getBlockPadding(content)
  const viewportRect = viewport.getBoundingClientRect()
  const scrollTop = viewport.scrollTop
  let contentBottom = padding.start + padding.end

  for (const item of items) {
    const rect = item.getBoundingClientRect()
    contentBottom = Math.max(
      contentBottom,
      rect.bottom - viewportRect.top + scrollTop + padding.end
    )
  }

  return contentBottom
}

function getMessageScrollerScrollable({
  content,
  scrollEdgeThreshold,
  spacer,
  viewport,
}: {
  content: HTMLElement | null
  scrollEdgeThreshold: number
  spacer: HTMLElement | null
  viewport: HTMLElement | null
}): MessageScrollerScrollable {
  if (!viewport || !content) {
    return { ...EMPTY_MESSAGE_SCROLLER_SCROLLABLE }
  }

  const contentBottom = getContentBottom({ content, spacer, viewport })

  return {
    start: viewport.scrollTop > scrollEdgeThreshold,
    end:
      contentBottom - viewport.scrollTop - viewport.clientHeight >
      scrollEdgeThreshold,
  }
}

function getNewScrollAnchor(items: HTMLElement[], previousItemCount: number) {
  for (let index = previousItemCount; index < items.length; index++) {
    const item = items[index]
    if (item?.dataset.scrollAnchor === "true") {
      return item
    }
  }
  return null
}

function getUnanchoredScrollAnchor(
  items: HTMLElement[],
  handledAnchors: { has(element: HTMLElement): boolean }
) {
  for (const item of items) {
    if (item.dataset.scrollAnchor === "true" && !handledAnchors.has(item)) {
      return item
    }
  }
  return null
}

function hasMultipleNewScrollAnchors(
  items: HTMLElement[],
  previousItemCount: number
) {
  let count = 0
  for (let index = previousItemCount; index < items.length; index++) {
    const item = items[index]
    if (item?.dataset.scrollAnchor !== "true") {
      continue
    }
    count += 1
    if (count > 1) {
      return true
    }
  }
  return false
}

function getLastScrollAnchor(items: HTMLElement[]) {
  for (let index = items.length - 1; index >= 0; index--) {
    const item = items[index]
    if (item?.dataset.scrollAnchor === "true") {
      return item
    }
  }
  return null
}

function getFirstVisibleMessageItem({
  content,
  spacer,
  viewport,
}: {
  content: HTMLElement
  spacer: HTMLElement | null
  viewport: HTMLElement
}) {
  const viewportRect = viewport.getBoundingClientRect()

  for (const item of getMessageScrollerItems(content, spacer)) {
    if (!item.dataset.messageId) {
      continue
    }
    const rect = item.getBoundingClientRect()
    if (rect.bottom > viewportRect.top && rect.top < viewportRect.bottom) {
      return item
    }
  }
  return null
}

function getElementTop(element: HTMLElement, viewport: HTMLElement) {
  const elementRect = element.getBoundingClientRect()
  const viewportRect = viewport.getBoundingClientRect()
  return elementRect.top - viewportRect.top + viewport.scrollTop
}

function getElementViewportTop(element: HTMLElement, viewport: HTMLElement) {
  return (
    element.getBoundingClientRect().top - viewport.getBoundingClientRect().top
  )
}

function getBlockPadding(element: HTMLElement) {
  const style = window.getComputedStyle(element)
  return {
    end: readCssPixel(style.paddingBlockEnd || style.paddingBottom),
    start: readCssPixel(style.paddingBlockStart || style.paddingTop),
  }
}

function readCssPixel(value: string | undefined) {
  if (!value) {
    return 0
  }
  const number = Number.parseFloat(value)
  return Number.isFinite(number) ? number : 0
}

function getElementScrollTop({
  align,
  element,
  scrollMargin,
  spacer,
  viewport,
}: {
  align: NonNullable<MessageScrollerScrollOptions["align"]>
  element: HTMLElement
  scrollMargin: number
  spacer: HTMLElement | null
  viewport: HTMLElement
}) {
  const elementTop = getElementTop(element, viewport)
  const elementHeight = element.getBoundingClientRect().height
  const contentPadding = getContentBlockPadding(spacer)

  if (align === "center") {
    const insetHeight = Math.max(
      0,
      viewport.clientHeight - contentPadding.start - contentPadding.end
    )
    return (
      elementTop -
      contentPadding.start -
      (insetHeight - elementHeight) / 2 -
      scrollMargin
    )
  }

  if (align === "end") {
    return (
      elementTop -
      viewport.clientHeight +
      elementHeight +
      contentPadding.end +
      scrollMargin
    )
  }

  if (align === "nearest") {
    const elementBottom = elementTop + elementHeight
    const viewportTop = viewport.scrollTop + contentPadding.start
    const viewportBottom =
      viewport.scrollTop + viewport.clientHeight - contentPadding.end

    if (elementTop >= viewportTop && elementBottom <= viewportBottom) {
      return viewport.scrollTop
    }
    if (elementTop < viewportTop) {
      return elementTop - contentPadding.start - scrollMargin
    }
    return (
      elementBottom - viewport.clientHeight + contentPadding.end + scrollMargin
    )
  }

  return elementTop - contentPadding.start - scrollMargin
}

function getContentBlockPadding(spacer: HTMLElement | null) {
  const content = spacer?.parentElement
  if (!content) {
    return { end: 0, start: 0 }
  }
  return getBlockPadding(content)
}

function getTailSpacerHeight({
  content,
  scrollTop,
  spacer,
  viewport,
}: {
  content: HTMLElement
  scrollTop: number
  spacer: HTMLElement | null
  viewport: HTMLElement
}) {
  const contentBottom = getContentBottom({ content, spacer, viewport })
  return scrollTop + viewport.clientHeight - contentBottom
}

function getMaxScrollTop(viewport: HTMLElement) {
  return Math.max(0, viewport.scrollHeight - viewport.clientHeight)
}

function getFlexGap(element: HTMLElement | null) {
  if (!element) {
    return 0
  }
  const style = window.getComputedStyle(element)
  const gap = style.rowGap === "normal" ? style.gap : style.rowGap
  return readCssPixel(gap)
}

// ── Context ─────────────────────────────────────────────────────────────

type MessageScrollerRegisterMessage = (
  messageId: string,
  element: HTMLElement | null,
  removedElement: HTMLElement | null
) => void

type MessageScrollerContextValue = {
  autoScrollRef: React.MutableRefObject<boolean>
  autoscrollingRef: React.MutableRefObject<boolean>
  autoscrollingTimeoutRef: React.MutableRefObject<number | null>
  streamingTurnRef: React.MutableRefObject<HTMLElement | null>
  contentRef: React.MutableRefObject<HTMLDivElement | null>
  defaultScrollPositionAppliedRef: React.MutableRefObject<boolean>
  firstItemRef: React.MutableRefObject<HTMLElement | null>
  itemCountRef: React.MutableRefObject<number>
  lastScrollTopRef: React.MutableRefObject<number>
  messageElementsRef: React.MutableRefObject<Map<string, HTMLElement>>
  modeRef: React.MutableRefObject<MessageScrollerMode>
  pendingScrollFrameRef: React.MutableRefObject<number | null>
  pendingScrollToMessageRef: React.MutableRefObject<{
    messageId: string
    options?: MessageScrollerScrollOptions
  } | null>
  prependRestoreRef: React.MutableRefObject<{
    element: HTMLElement
    viewportTop: number
  } | null>
  preserveScrollOnPrependRef: React.MutableRefObject<boolean>
  rootRef: React.MutableRefObject<HTMLDivElement | null>
  scrollEdgeThresholdRef: React.MutableRefObject<number>
  scrollMarginRef: React.MutableRefObject<number>
  scrollPreviousItemPeekRef: React.MutableRefObject<number>
  spacerGapRef: React.MutableRefObject<number>
  spacerHeightRef: React.MutableRefObject<number>
  spacerRef: React.MutableRefObject<HTMLDivElement | null>
  stateFrameRef: React.MutableRefObject<number | null>
  stateStore: MessageScrollerStore<MessageScrollerScrollable>
  viewportRef: React.MutableRefObject<HTMLDivElement | null>
  visibilityFrameRef: React.MutableRefObject<number | null>
  visibilityObserverRef: React.MutableRefObject<IntersectionObserver | null>
  visibilityStore: MessageScrollerStore<MessageScrollerVisibilityState>
  visibleMessageIdsRef: React.MutableRefObject<Set<string>>
  handledScrollAnchorsRef: React.MutableRefObject<WeakSet<HTMLElement>>
  handleContentChange: () => void
  handleResize: () => void
  observeVisibility: () => void
  unobserveVisibility: () => void
  scrollToEnd: (options?: MessageScrollerScrollOptions) => boolean
  scrollToMessage: (
    messageId: string,
    options?: MessageScrollerScrollOptions
  ) => boolean
  scrollToStart: (options?: MessageScrollerScrollOptions) => boolean
  setContentElement: (element: HTMLDivElement | null) => void
  setRootElement: (element: HTMLDivElement | null) => void
  setSpacerElement: (element: HTMLDivElement | null) => void
  setViewportElement: (element: HTMLDivElement | null) => void
  syncAfterScroll: () => void
  userScrollIntent: () => void
}

type MessageScrollerStore<T> = {
  getSnapshot: () => T
  hasListeners: () => boolean
  setSnapshot: (next: T) => void
  subscribe: (
    listener: () => void,
    onFirstSubscribe?: () => void,
    onLastUnsubscribe?: () => void
  ) => () => void
}

const MessageScrollerContext =
  React.createContext<MessageScrollerContextValue | null>(null)
const MessageScrollerItemContext =
  React.createContext<MessageScrollerRegisterMessage | null>(null)

function useMessageScrollerContext() {
  const context = React.useContext(MessageScrollerContext)
  if (!context) {
    throw new Error("useMessageScroller must be used within a MessageScroller.")
  }
  return context
}

function useMessageScrollerItemContext() {
  const context = React.useContext(MessageScrollerItemContext)
  if (!context) {
    throw new Error(
      "MessageScrollerItem must be used within a MessageScroller."
    )
  }
  return context
}

// ── Controller ──────────────────────────────────────────────────────────

type UseMessageScrollerProviderProps = {
  autoScroll?: boolean
  defaultScrollPosition?: MessageScrollerDefaultScrollPosition
  scrollEdgeThreshold?: number
  scrollPreviousItemPeek?: number
  scrollMargin?: number
}

function useMessageScrollerController({
  autoScroll = false,
  defaultScrollPosition = "end",
  scrollEdgeThreshold = DEFAULT_SCROLL_EDGE_THRESHOLD,
  scrollPreviousItemPeek = DEFAULT_SCROLL_PREVIOUS_ITEM_PEEK,
  scrollMargin = DEFAULT_SCROLL_MARGIN,
}: UseMessageScrollerProviderProps) {
  const autoScrollRef = React.useRef(autoScroll)
  const autoscrollingRef = React.useRef(false)
  const autoscrollingTimeoutRef = React.useRef<number | null>(null)
  const streamingTurnRef = React.useRef<HTMLElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const defaultScrollPositionAppliedRef = React.useRef(false)
  const firstItemRef = React.useRef<HTMLElement | null>(null)
  const itemCountRef = React.useRef(0)
  const lastScrollTopRef = React.useRef(0)
  const messageElementsRef = React.useRef(new Map<string, HTMLElement>())
  const modeRef = React.useRef<MessageScrollerMode>(
    autoScroll ? "following-bottom" : "free-scrolling"
  )
  const pendingScrollFrameRef = React.useRef<number | null>(null)
  const pendingScrollToMessageRef = React.useRef<{
    messageId: string
    options?: MessageScrollerScrollOptions
  } | null>(null)
  const prependRestoreRef = React.useRef<{
    element: HTMLElement
    viewportTop: number
  } | null>(null)
  const preserveScrollOnPrependRef = React.useRef(true)
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const scrollEdgeThresholdRef = React.useRef(scrollEdgeThreshold)
  const scrollMarginRef = React.useRef(scrollMargin)
  const scrollPreviousItemPeekRef = React.useRef(scrollPreviousItemPeek)
  const spacerGapRef = React.useRef(0)
  const spacerHeightRef = React.useRef(0)
  const spacerRef = React.useRef<HTMLDivElement | null>(null)
  const stateFrameRef = React.useRef<number | null>(null)
  const stateStoreRef =
    React.useRef<MessageScrollerStore<MessageScrollerScrollable> | null>(null)
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const visibilityFrameRef = React.useRef<number | null>(null)
  const visibilityObserverRef = React.useRef<IntersectionObserver | null>(null)
  const visibilityStoreRef =
    React.useRef<MessageScrollerStore<MessageScrollerVisibilityState> | null>(
      null
    )
  const visibleMessageIdsRef = React.useRef(new Set<string>())
  const handledScrollAnchorsRef = React.useRef(new WeakSet<HTMLElement>())

  if (stateStoreRef.current === null) {
    stateStoreRef.current = createExternalStore(
      { ...EMPTY_MESSAGE_SCROLLER_SCROLLABLE },
      areScrollStatesEqual
    )
  }
  if (visibilityStoreRef.current === null) {
    visibilityStoreRef.current = createExternalStore(
      { ...EMPTY_MESSAGE_SCROLLER_VISIBILITY_STATE },
      areVisibilityStatesEqual
    )
  }

  autoScrollRef.current = autoScroll
  scrollEdgeThresholdRef.current = scrollEdgeThreshold
  scrollMarginRef.current = scrollMargin
  scrollPreviousItemPeekRef.current = scrollPreviousItemPeek

  const stateStore = stateStoreRef.current
  const visibilityStore = visibilityStoreRef.current

  const previousDefaultScrollPositionRef = React.useRef(defaultScrollPosition)
  if (
    previousDefaultScrollPositionRef.current !== defaultScrollPosition
  ) {
    previousDefaultScrollPositionRef.current = defaultScrollPosition
    defaultScrollPositionAppliedRef.current = false
  }

  const writeStateAttributes = React.useCallback(
    (state: MessageScrollerScrollable) => {
      const root = rootRef.current
      const viewport = viewportRef.current
      const scrollable = [state.start && "start", state.end && "end"]
        .filter(Boolean)
        .join(" ")
      const autoScrolling = autoscrollingRef.current

      for (const element of [root, viewport]) {
        if (!element) {
          continue
        }
        if (scrollable) {
          element.setAttribute("data-scrollable", scrollable)
        } else {
          element.removeAttribute("data-scrollable")
        }
        element.toggleAttribute("data-autoscrolling", autoScrolling)
      }
    },
    []
  )

  const reconcileFollowMode = React.useCallback(
    (scrollable: MessageScrollerScrollable) => {
      const scrollTop = viewportRef.current?.scrollTop ?? 0
      const scrolledUp =
        scrollTop < lastScrollTopRef.current - SCROLL_POSITION_EPSILON
      lastScrollTopRef.current = scrollTop

      if (
        autoScrollRef.current &&
        !scrollable.end &&
        modeRef.current !== "settling-jump" &&
        modeRef.current !== "anchored-to-message"
      ) {
        modeRef.current = "following-bottom"
      } else if (
        modeRef.current === "following-bottom" &&
        scrollable.end &&
        scrolledUp &&
        !autoscrollingRef.current
      ) {
        modeRef.current = "free-scrolling"
      }
    },
    []
  )

  const commitScrollState = React.useCallback(() => {
    const nextState = getMessageScrollerScrollable({
      content: contentRef.current,
      scrollEdgeThreshold: scrollEdgeThresholdRef.current,
      spacer: spacerRef.current,
      viewport: viewportRef.current,
    })

    reconcileFollowMode(nextState)

    const publishedState =
      modeRef.current === "following-bottom"
        ? { ...nextState, end: false }
        : nextState

    writeStateAttributes(publishedState)
    stateStore.setSnapshot(publishedState)
  }, [reconcileFollowMode, stateStore, writeStateAttributes])

  const scheduleStateCommit = React.useCallback(() => {
    if (stateFrameRef.current !== null) {
      return
    }
    stateFrameRef.current = window.requestAnimationFrame(() => {
      stateFrameRef.current = null
      commitScrollState()
    })
  }, [commitScrollState])

  const scheduleVisibilitySync = React.useCallback(() => {
    if (!visibilityStore.hasListeners()) {
      return
    }
    if (visibilityFrameRef.current !== null) {
      return
    }
    visibilityFrameRef.current = window.requestAnimationFrame(() => {
      visibilityFrameRef.current = null
      if (!visibilityStore.hasListeners()) {
        return
      }
      const content = contentRef.current
      const viewport = viewportRef.current
      if (!content || !viewport) {
        return
      }
      const viewportRect = viewport.getBoundingClientRect()
      const lineTop =
        viewportRect.top +
        scrollMarginRef.current +
        scrollPreviousItemPeekRef.current
      const trackByLayout = typeof IntersectionObserver === "undefined"

      const visible: string[] = []
      let currentAnchorId: string | null = null

      for (const item of getMessageScrollerItems(
        content,
        spacerRef.current
      )) {
        const messageId = item.dataset.messageId
        if (!messageId) {
          continue
        }
        const isAnchor = item.dataset.scrollAnchor === "true"
        const rect = isAnchor || trackByLayout ? item.getBoundingClientRect() : null

        const isVisible =
          trackByLayout && rect
            ? rect.bottom > lineTop && rect.top < viewportRect.bottom
            : visibleMessageIdsRef.current.has(messageId)

        if (isVisible) {
          visible.push(messageId)
        }

        if (isAnchor && rect && rect.top <= lineTop + SCROLL_POSITION_EPSILON) {
          currentAnchorId = messageId
        }
      }

      if (visible.length === 0 && currentAnchorId === null) {
        visibilityStore.setSnapshot({
          ...EMPTY_MESSAGE_SCROLLER_VISIBILITY_STATE,
        })
        return
      }

      visibilityStore.setSnapshot({ currentAnchorId, visibleMessageIds: visible })
    })
  }, [visibilityStore])

  const setAutoScrolling = React.useCallback(
    (autoscrolling: boolean) => {
      if (autoscrollingTimeoutRef.current !== null) {
        window.clearTimeout(autoscrollingTimeoutRef.current)
        autoscrollingTimeoutRef.current = null
      }
      if (autoscrollingRef.current !== autoscrolling) {
        autoscrollingRef.current = autoscrolling
        commitScrollState()
      }
      if (autoscrolling) {
        autoscrollingTimeoutRef.current = window.setTimeout(() => {
          autoscrollingTimeoutRef.current = null
          autoscrollingRef.current = false
          commitScrollState()
        }, AUTOSCROLLING_CLEAR_DELAY)
      }
    },
    [commitScrollState]
  )

  const setTailSpacerHeight = React.useCallback((height: number) => {
    const spacer = spacerRef.current
    if (!spacer) {
      return
    }
    const nextHeight = Math.max(0, Math.ceil(height))
    if (spacerHeightRef.current === nextHeight) {
      return
    }
    spacerHeightRef.current = nextHeight
    spacer.hidden = nextHeight === 0
    spacer.style.height = `${nextHeight}px`
    spacer.style.marginTop =
      nextHeight > 0 ? `${-spacerGapRef.current}px` : ""
  }, [])

  const scrollToPosition = React.useCallback(
    (
      scrollTop: number,
      {
        behavior = "auto",
        autoscrolling = false,
      }: {
        behavior?: ScrollBehavior
        autoscrolling?: boolean
      } = {}
    ) => {
      const viewport = viewportRef.current
      if (!viewport) {
        return
      }
      const nextScrollTop = Math.max(0, scrollTop)

      if (
        Math.abs(viewport.scrollTop - nextScrollTop) <= SCROLL_POSITION_EPSILON
      ) {
        viewport.scrollTop = nextScrollTop
        commitScrollState()
        return
      }

      if (autoscrolling) {
        setAutoScrolling(true)
      }
      viewport.scrollTo({ top: nextScrollTop, behavior })
      scheduleStateCommit()
    },
    [commitScrollState, scheduleStateCommit, setAutoScrolling]
  )

  const scrollToStart = React.useCallback(
    ({ behavior = "auto" }: MessageScrollerScrollOptions = {}) => {
      if (!viewportRef.current) {
        return false
      }
      setTailSpacerHeight(0)
      streamingTurnRef.current = null
      modeRef.current = "free-scrolling"
      scrollToPosition(0, { behavior })
      scheduleVisibilitySync()
      return true
    },
    [scheduleVisibilitySync, scrollToPosition, setTailSpacerHeight]
  )

  const scrollToEnd = React.useCallback(
    ({ behavior = "auto" }: MessageScrollerScrollOptions = {}) => {
      const viewport = viewportRef.current
      if (!viewport) {
        return false
      }
      setTailSpacerHeight(0)
      streamingTurnRef.current = null
      modeRef.current = autoScrollRef.current
        ? "following-bottom"
        : "free-scrolling"
      scrollToPosition(getMaxScrollTop(viewport), {
        autoscrolling: true,
        behavior,
      })
      scheduleVisibilitySync()
      return true
    },
    [scheduleVisibilitySync, scrollToPosition, setTailSpacerHeight]
  )

  const scrollToElement = React.useCallback(
    (
      element: HTMLElement,
      {
        align = "start",
        behavior = "auto",
        scrollMargin: scrollMarginOption = scrollMarginRef.current,
      }: MessageScrollerScrollOptions = {},
      {
        keepPreviousPeek = false,
      }: {
        keepPreviousPeek?: boolean
      } = {}
    ) => {
      const content = contentRef.current
      const viewport = viewportRef.current

      if (!content || !viewport || !content.contains(element)) {
        return false
      }

      const scrollTop = getElementScrollTop({
        align,
        element,
        scrollMargin: keepPreviousPeek
          ? scrollMarginOption + scrollPreviousItemPeekRef.current
          : scrollMarginOption,
        spacer: spacerRef.current,
        viewport,
      })

      const nextSpacerHeight = getTailSpacerHeight({
        content,
        scrollTop,
        spacer: spacerRef.current,
        viewport,
      })

      setTailSpacerHeight(nextSpacerHeight)
      prependRestoreRef.current = {
        element,
        viewportTop: getElementViewportTop(element, viewport),
      }

      modeRef.current = keepPreviousPeek
        ? "anchored-to-message"
        : "settling-jump"
      streamingTurnRef.current = keepPreviousPeek ? element : null

      scrollToPosition(scrollTop, { behavior })
      scheduleVisibilitySync()
      return true
    },
    [scheduleVisibilitySync, scrollToPosition, setTailSpacerHeight]
  )

  const reanchorToAnchoredMessage = React.useCallback(() => {
    const element = streamingTurnRef.current
    if (
      !element ||
      !element.isConnected ||
      modeRef.current !== "anchored-to-message"
    ) {
      return false
    }
    return scrollToElement(element, { align: "start" }, { keepPreviousPeek: true })
  }, [scrollToElement])

  const scrollToMessage = React.useCallback(
    (messageId: string, options?: MessageScrollerScrollOptions) => {
      const element = messageElementsRef.current.get(messageId)

      if (!element) {
        if (itemCountRef.current === 0) {
          pendingScrollToMessageRef.current = { messageId, options }
          defaultScrollPositionAppliedRef.current = true
          return true
        }
        return false
      }

      defaultScrollPositionAppliedRef.current = true

      if (scrollToElement(element, options)) {
        pendingScrollToMessageRef.current = null
        return true
      }

      pendingScrollToMessageRef.current = { messageId, options }
      return true
    },
    [scrollToElement]
  )

  const flushPendingScrollToMessage = React.useCallback(() => {
    const pending = pendingScrollToMessageRef.current
    if (!pending) {
      return false
    }
    const element = messageElementsRef.current.get(pending.messageId)
    if (!element) {
      return false
    }
    const handled = scrollToElement(element, pending.options)
    if (!handled) {
      return false
    }
    pendingScrollToMessageRef.current = null
    defaultScrollPositionAppliedRef.current = true
    return true
  }, [scrollToElement])

  const restorePrependedAnchor = React.useCallback(() => {
    const anchor = prependRestoreRef.current
    const viewport = viewportRef.current

    if (!anchor || !viewport || !anchor.element.isConnected) {
      return false
    }

    const nextViewportTop = getElementViewportTop(anchor.element, viewport)
    const delta = nextViewportTop - anchor.viewportTop

    if (Math.abs(delta) <= SCROLL_POSITION_EPSILON) {
      return false
    }

    viewport.scrollTop += delta
    anchor.viewportTop = getElementViewportTop(anchor.element, viewport)
    scheduleStateCommit()
    scheduleVisibilitySync()
    return true
  }, [scheduleStateCommit, scheduleVisibilitySync])

  const capturePrependAnchor = React.useCallback(() => {
    const content = contentRef.current
    const viewport = viewportRef.current

    if (!content || !viewport) {
      prependRestoreRef.current = null
      return
    }

    const anchor = getFirstVisibleMessageItem({
      content,
      spacer: spacerRef.current,
      viewport,
    })

    prependRestoreRef.current = anchor
      ? {
          element: anchor,
          viewportTop: getElementViewportTop(anchor, viewport),
        }
      : null
  }, [])

  const schedulePendingScrollToMessageFlush = React.useCallback(() => {
    if (pendingScrollFrameRef.current !== null) {
      return
    }
    pendingScrollFrameRef.current = window.requestAnimationFrame(() => {
      pendingScrollFrameRef.current = null
      if (flushPendingScrollToMessage()) {
        capturePrependAnchor()
      }
    })
  }, [capturePrependAnchor, flushPendingScrollToMessage])

  const applyDefaultScrollPosition = React.useCallback(() => {
    if (
      !defaultScrollPosition ||
      defaultScrollPositionAppliedRef.current ||
      itemCountRef.current === 0
    ) {
      return false
    }

    let handled = false

    if (defaultScrollPosition === "last-anchor") {
      const content = contentRef.current
      const viewport = viewportRef.current
      const anchor =
        content && viewport
          ? getLastScrollAnchor(getMessageScrollerItems(content, spacerRef.current))
          : null

      if (!content || !viewport || !anchor) {
        handled = scrollToEnd({ behavior: "auto" })
      } else {
        const anchorTop = getElementTop(anchor, viewport)
        const contentBottom = getContentBottom({
          content,
          spacer: spacerRef.current,
          viewport,
        })
        const lastTurnFits = contentBottom - anchorTop <= viewport.clientHeight

        handled = lastTurnFits
          ? scrollToEnd({ behavior: "auto" })
          : scrollToElement(
              anchor,
              { align: "start" },
              { keepPreviousPeek: true }
            )
      }
    } else {
      handled =
        defaultScrollPosition === "end"
          ? scrollToEnd({ behavior: "auto" })
          : scrollToStart({ behavior: "auto" })
    }

    if (!handled) {
      return false
    }

    defaultScrollPositionAppliedRef.current = true
    return true
  }, [defaultScrollPosition, scrollToElement, scrollToEnd, scrollToStart])

  const handleContentChange = React.useCallback(() => {
    const content = contentRef.current
    if (!content) {
      return
    }

    const items = getMessageScrollerItems(content, spacerRef.current)
    const previousItemCount = itemCountRef.current
    const previousFirstItem = firstItemRef.current

    itemCountRef.current = items.length
    firstItemRef.current = items[0] ?? null

    const reconcileScrollPosition = () => {
      if (flushPendingScrollToMessage()) {
        return
      }

      if (previousItemCount === 0) {
        if (applyDefaultScrollPosition()) {
          return
        }
        if (
          items.length > 0 &&
          autoScrollRef.current &&
          scrollToEnd({ behavior: "auto" })
        ) {
          return
        }
        commitScrollState()
        scheduleVisibilitySync()
        return
      }

      const previousFirstItemIndex = previousFirstItem
        ? items.indexOf(previousFirstItem)
        : -1
      const didPrepend =
        preserveScrollOnPrependRef.current && previousFirstItemIndex > 0

      if (didPrepend) {
        restorePrependedAnchor()
        return
      }

      if (items.length > previousItemCount) {
        const anchor = getNewScrollAnchor(items, previousItemCount)

        if (anchor) {
          if (
            autoScrollRef.current &&
            modeRef.current === "following-bottom" &&
            hasMultipleNewScrollAnchors(items, previousItemCount)
          ) {
            scrollToEnd({ behavior: "auto" })
            return
          }

          scrollToElement(anchor, { align: "start" }, { keepPreviousPeek: true })
          handledScrollAnchorsRef.current.add(anchor)
          return
        }
      }

      if (items.length === previousItemCount) {
        const anchor = getUnanchoredScrollAnchor(
          items,
          handledScrollAnchorsRef.current
        )

        if (anchor) {
          scrollToElement(anchor, { align: "start" }, { keepPreviousPeek: true })
          handledScrollAnchorsRef.current.add(anchor)
          return
        }
      }

      if (modeRef.current === "following-bottom" && autoScrollRef.current) {
        scrollToEnd({ behavior: "auto" })
      } else {
        commitScrollState()
        scheduleVisibilitySync()
      }
    }

    reconcileScrollPosition()
    capturePrependAnchor()
  }, [
    applyDefaultScrollPosition,
    capturePrependAnchor,
    commitScrollState,
    flushPendingScrollToMessage,
    restorePrependedAnchor,
    scheduleVisibilitySync,
    scrollToElement,
    scrollToEnd,
  ])

  const handleResize = React.useCallback(() => {
    if (modeRef.current === "following-bottom" && autoScrollRef.current) {
      scrollToEnd({ behavior: "auto" })
      return
    }

    const previousSpacerHeight = spacerHeightRef.current

    if (reanchorToAnchoredMessage()) {
      if (
        autoScrollRef.current &&
        previousSpacerHeight > 0 &&
        spacerHeightRef.current === 0
      ) {
        scrollToEnd({ behavior: "auto" })
      }
      return
    }

    scheduleStateCommit()
    scheduleVisibilitySync()
  }, [
    reanchorToAnchoredMessage,
    scheduleStateCommit,
    scheduleVisibilitySync,
    scrollToEnd,
  ])

  const observeVisibility = React.useCallback(() => {
    const viewport = viewportRef.current

    if (!viewport || !visibilityStore.hasListeners()) {
      return
    }

    if (typeof IntersectionObserver === "undefined") {
      scheduleVisibilitySync()
      return
    }

    if (!visibilityObserverRef.current) {
      visibilityObserverRef.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const messageId = (entry.target as HTMLElement).dataset.messageId
            if (!messageId) {
              continue
            }
            if (entry.isIntersecting) {
              visibleMessageIdsRef.current.add(messageId)
            } else {
              visibleMessageIdsRef.current.delete(messageId)
            }
          }
          scheduleVisibilitySync()
        },
        {
          root: viewport,
          rootMargin: `-${
            scrollMarginRef.current + scrollPreviousItemPeekRef.current
          }px 0px 0px 0px`,
          threshold: [0, 0.01, 0.5, 1],
        }
      )
    }

    messageElementsRef.current.forEach((element) => {
      visibilityObserverRef.current?.observe(element)
    })
    scheduleVisibilitySync()
  }, [scheduleVisibilitySync, visibilityStore])

  const unobserveVisibility = React.useCallback(() => {
    if (visibilityFrameRef.current !== null) {
      window.cancelAnimationFrame(visibilityFrameRef.current)
      visibilityFrameRef.current = null
    }
    visibilityObserverRef.current?.disconnect()
    visibilityObserverRef.current = null
    visibleMessageIdsRef.current.clear()
    visibilityStore.setSnapshot({ ...EMPTY_MESSAGE_SCROLLER_VISIBILITY_STATE })
  }, [visibilityStore])

  const registerMessage = React.useCallback<MessageScrollerRegisterMessage>(
    (messageId, element, removedElement) => {
      if (element) {
        messageElementsRef.current.set(messageId, element)
        visibilityObserverRef.current?.observe(element)
        scheduleVisibilitySync()

        if (pendingScrollToMessageRef.current?.messageId === messageId) {
          schedulePendingScrollToMessageFlush()
        }
        return
      }

      if (
        removedElement &&
        messageElementsRef.current.get(messageId) === removedElement
      ) {
        messageElementsRef.current.delete(messageId)
        visibleMessageIdsRef.current.delete(messageId)
        visibilityObserverRef.current?.unobserve(removedElement)
        scheduleVisibilitySync()
      }
    },
    [schedulePendingScrollToMessageFlush, scheduleVisibilitySync]
  )

  const userScrollIntent = React.useCallback(() => {
    if (
      modeRef.current === "following-bottom" ||
      modeRef.current === "anchored-to-message" ||
      modeRef.current === "settling-jump"
    ) {
      streamingTurnRef.current = null
      modeRef.current = "free-scrolling"
    }
  }, [])

  const mirrorStateAttributes = React.useCallback(
    () => writeStateAttributes(stateStore.getSnapshot()),
    [stateStore, writeStateAttributes]
  )

  const setRootElement = React.useCallback(
    (element: HTMLDivElement | null) => {
      rootRef.current = element
      if (element) {
        mirrorStateAttributes()
      }
    },
    [mirrorStateAttributes]
  )

  const setViewportElement = React.useCallback(
    (element: HTMLDivElement | null) => {
      viewportRef.current = element
      if (element) {
        mirrorStateAttributes()
      }
    },
    [mirrorStateAttributes]
  )

  const setContentElement = React.useCallback((element: HTMLDivElement | null) => {
    contentRef.current = element
  }, [])

  const setSpacerElement = React.useCallback((element: HTMLDivElement | null) => {
    spacerRef.current = element
    spacerGapRef.current = getFlexGap(element?.parentElement ?? null)
  }, [])

  const syncAfterScroll = React.useCallback(() => {
    commitScrollState()
    scheduleVisibilitySync()
    capturePrependAnchor()
  }, [capturePrependAnchor, commitScrollState, scheduleVisibilitySync])

  React.useLayoutEffect(() => {
    applyDefaultScrollPosition()
  }, [applyDefaultScrollPosition])

  React.useEffect(() => {
    return () => {
      if (stateFrameRef.current !== null) {
        window.cancelAnimationFrame(stateFrameRef.current)
        stateFrameRef.current = null
      }
      if (visibilityFrameRef.current !== null) {
        window.cancelAnimationFrame(visibilityFrameRef.current)
        visibilityFrameRef.current = null
      }
      if (autoscrollingTimeoutRef.current !== null) {
        window.clearTimeout(autoscrollingTimeoutRef.current)
        autoscrollingTimeoutRef.current = null
      }
      if (pendingScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(pendingScrollFrameRef.current)
        pendingScrollFrameRef.current = null
      }
      visibilityObserverRef.current?.disconnect()
      visibilityObserverRef.current = null
    }
  }, [])

  React.useLayoutEffect(() => {
    if (
      autoScroll &&
      modeRef.current === "following-bottom" &&
      itemCountRef.current > 0
    ) {
      scrollToEnd({ behavior: "auto" })
      return
    }
    commitScrollState()
  }, [autoScroll, commitScrollState, scrollToEnd])

  const context = React.useMemo<MessageScrollerContextValue>(
    () => ({
      autoScrollRef,
      autoscrollingRef,
      autoscrollingTimeoutRef,
      streamingTurnRef,
      contentRef,
      defaultScrollPositionAppliedRef,
      firstItemRef,
      itemCountRef,
      lastScrollTopRef,
      messageElementsRef,
      modeRef,
      pendingScrollFrameRef,
      pendingScrollToMessageRef,
      prependRestoreRef,
      preserveScrollOnPrependRef,
      rootRef,
      scrollEdgeThresholdRef,
      scrollMarginRef,
      scrollPreviousItemPeekRef,
      spacerGapRef,
      spacerHeightRef,
      spacerRef,
      stateFrameRef,
      stateStore,
      viewportRef,
      visibilityFrameRef,
      visibilityObserverRef,
      visibilityStore,
      visibleMessageIdsRef,
      handledScrollAnchorsRef,
      handleContentChange,
      handleResize,
      observeVisibility,
      unobserveVisibility,
      scrollToEnd,
      scrollToMessage,
      scrollToStart,
      setContentElement,
      setRootElement,
      setSpacerElement,
      setViewportElement,
      syncAfterScroll,
      userScrollIntent,
    }),
    [
      autoScrollRef,
      autoscrollingRef,
      autoscrollingTimeoutRef,
      streamingTurnRef,
      contentRef,
      defaultScrollPositionAppliedRef,
      firstItemRef,
      itemCountRef,
      lastScrollTopRef,
      messageElementsRef,
      modeRef,
      pendingScrollFrameRef,
      pendingScrollToMessageRef,
      prependRestoreRef,
      preserveScrollOnPrependRef,
      rootRef,
      scrollEdgeThresholdRef,
      scrollMarginRef,
      scrollPreviousItemPeekRef,
      spacerGapRef,
      spacerHeightRef,
      spacerRef,
      stateFrameRef,
      stateStore,
      viewportRef,
      visibilityFrameRef,
      visibilityObserverRef,
      visibilityStore,
      visibleMessageIdsRef,
      handledScrollAnchorsRef,
      handleContentChange,
      handleResize,
      observeVisibility,
      unobserveVisibility,
      scrollToEnd,
      scrollToMessage,
      scrollToStart,
      setContentElement,
      setRootElement,
      setSpacerElement,
      setViewportElement,
      syncAfterScroll,
      userScrollIntent,
    ]
  )

  return { context, registerMessage }
}

// ── Public components ───────────────────────────────────────────────────

function MessageScrollerProvider({
  autoScroll = false,
  children,
  defaultScrollPosition = "end",
  scrollEdgeThreshold,
  scrollPreviousItemPeek,
  scrollMargin,
}: UseMessageScrollerProviderProps & { children?: React.ReactNode }) {
  const { context, registerMessage } = useMessageScrollerController({
    autoScroll,
    defaultScrollPosition,
    scrollEdgeThreshold,
    scrollPreviousItemPeek,
    scrollMargin,
  })

  return (
    <MessageScrollerContext.Provider value={context}>
      <MessageScrollerItemContext.Provider value={registerMessage}>
        {children}
      </MessageScrollerItemContext.Provider>
    </MessageScrollerContext.Provider>
  )
}

function MessageScroller({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { setRootElement } = useMessageScrollerContext()

  return (
    <div ref={setRootElement} className={className} {...props} />
  )
}

function MessageScrollerViewport({
  "aria-label": ariaLabel,
  className,
  onKeyDown,
  onScroll,
  onTouchMove,
  onWheel,
  preserveScrollOnPrepend = true,
  role,
  tabIndex,
  ...props
}: React.ComponentProps<"div"> & { preserveScrollOnPrepend?: boolean }) {
  const {
    handleResize,
    preserveScrollOnPrependRef,
    setViewportElement,
    syncAfterScroll,
    userScrollIntent,
    viewportRef,
  } = useMessageScrollerContext()

  preserveScrollOnPrependRef.current = preserveScrollOnPrepend

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    syncAfterScroll()
    onScroll?.(event)
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    userScrollIntent()
    onWheel?.(event)
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    userScrollIntent()
    onTouchMove?.(event)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (USER_SCROLL_KEYS.has(event.key)) {
      userScrollIntent()
    }
    onKeyDown?.(event)
  }

  React.useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || typeof ResizeObserver === "undefined") {
      return
    }

    let frame = 0
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(handleResize)
    })
    observer.observe(viewport)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [handleResize, viewportRef])

  return (
    <div
      ref={setViewportElement}
      role={role ?? "region"}
      aria-label={ariaLabel ?? "Messages"}
      tabIndex={tabIndex ?? 0}
      onKeyDown={handleKeyDown}
      onScroll={handleScroll}
      onTouchMove={handleTouchMove}
      onWheel={handleWheel}
      className={className}
      {...props}
    />
  )
}

function MessageScrollerContent({
  "aria-relevant": ariaRelevant,
  className,
  role,
  ...props
}: React.ComponentProps<"div">) {
  const {
    handleContentChange,
    handleResize,
    setContentElement,
    setSpacerElement,
  } = useMessageScrollerContext()
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  const setContentRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      contentRef.current = element
      setContentElement(element)
    },
    [setContentElement]
  )

  React.useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) {
      return
    }

    handleContentChange()

    if (typeof MutationObserver === "undefined") {
      return
    }

    const observer = new MutationObserver(() => {
      handleContentChange()
    })
    observer.observe(content, { childList: true })

    return () => observer.disconnect()
  }, [handleContentChange])

  React.useEffect(() => {
    const content = contentRef.current
    if (!content || typeof ResizeObserver === "undefined") {
      return
    }

    let frame = 0
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(handleResize)
    })
    observer.observe(content)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [handleResize])

  return (
    <div
      ref={setContentRef}
      role={role ?? "log"}
      aria-relevant={ariaRelevant ?? "additions"}
      className={className}
      {...props}
    >
      {props.children}
      <div
        ref={setSpacerElement}
        aria-hidden="true"
        data-message-scroller-spacer=""
        hidden
      />
    </div>
  )
}

function MessageScrollerItem({
  messageId,
  scrollAnchor = false,
  ...props
}: React.ComponentProps<"div"> & {
  messageId?: string
  scrollAnchor?: boolean
}) {
  const registerMessage = useMessageScrollerItemContext()
  const elementRef = React.useRef<HTMLDivElement | null>(null)

  const setItemRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      const previousElement = elementRef.current
      elementRef.current = element

      if (messageId) {
        registerMessage(messageId, element, previousElement)
      }
    },
    [messageId, registerMessage]
  )

  return (
    <div
      ref={setItemRef}
      data-message-id={messageId}
      data-scroll-anchor={scrollAnchor ? "true" : "false"}
      {...props}
    />
  )
}

function MessageScrollerButton({
  direction = "end",
  className,
  children,
  render,
  variant = "secondary",
  size = "icon-sm",
  ...props
}: React.ComponentProps<"button"> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size"> & {
    direction?: "start" | "end"
    render?: React.ReactElement
  }) {
  const { scrollToEnd, scrollToStart, stateStore } = useMessageScrollerContext()
  const getSnapshot = React.useCallback(() => {
    const state = stateStore.getSnapshot()
    return direction === "start" ? state.start : state.end
  }, [direction, stateStore])
  const isActive = React.useSyncExternalStore(
    stateStore.subscribe,
    getSnapshot,
    getSnapshot
  )

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (!isActive) {
      return
    }

    props.onClick?.(event)

    if (!event.defaultPrevented) {
      event.currentTarget.blur()
      if (direction === "start") {
        scrollToStart({ behavior: "smooth" })
      } else {
        scrollToEnd({ behavior: "smooth" })
      }
    }
  }

  const buttonProps = {
    type: "button",
    ...(!isActive ? { inert: true } : {}),
    tabIndex: isActive ? undefined : -1,
    "data-slot": "message-scroller-button",
    "data-direction": direction,
    "data-variant": variant,
    "data-size": size,
    "data-active": isActive ? "true" : "false",
    className: cn(
      "absolute inset-s-1/2 -translate-x-1/2 border-border bg-background text-foreground transition-[translate,scale,opacity] duration-200 hover:bg-muted hover:text-foreground data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0 data-[active=false]:duration-400 data-[active=false]:ease-[cubic-bezier(0.7,0,0.84,0)] data-[active=true]:translate-y-0 data-[active=true]:scale-100 data-[active=true]:opacity-100 data-[active=true]:ease-[cubic-bezier(0.23,1,0.32,1)] data-[direction=end]:bottom-4 data-[direction=end]:data-[active=false]:translate-y-full data-[direction=start]:top-4 data-[direction=start]:data-[active=false]:-translate-y-full rtl:translate-x-1/2 data-[direction=start]:[&_svg]:rotate-180",
      className
    ),
    onClick: handleClick,
  }

  if (render && React.isValidElement(render)) {
    return React.cloneElement(
      render as React.ReactElement<Record<string, unknown>>,
      buttonProps as Record<string, unknown>
    )
  }

  return (
    <Button variant={variant} size={size} {...buttonProps} {...props}>
      {children ?? (
        <>
          <ArrowDownIcon />
          <span className="sr-only">
            {direction === "end" ? "Scroll to end" : "Scroll to start"}
          </span>
        </>
      )}
    </Button>
  )
}

function useMessageScroller() {
  const { scrollToEnd, scrollToMessage, scrollToStart } =
    useMessageScrollerContext()

  return React.useMemo(
    () => ({
      scrollToEnd,
      scrollToMessage,
      scrollToStart,
    }),
    [scrollToEnd, scrollToMessage, scrollToStart]
  )
}

function useMessageScrollerScrollable(): MessageScrollerScrollable {
  const { stateStore } = useMessageScrollerContext()

  return React.useSyncExternalStore(
    stateStore.subscribe,
    stateStore.getSnapshot,
    stateStore.getSnapshot
  )
}

function useMessageScrollerVisibility(): MessageScrollerVisibilityState {
  const { observeVisibility, unobserveVisibility, visibilityStore } =
    useMessageScrollerContext()
  const subscribe = React.useCallback(
    (listener: () => void) =>
      visibilityStore.subscribe(
        listener,
        observeVisibility,
        unobserveVisibility
      ),
    [observeVisibility, unobserveVisibility, visibilityStore]
  )

  return React.useSyncExternalStore(
    subscribe,
    visibilityStore.getSnapshot,
    visibilityStore.getSnapshot
  )
}

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
}
export type {
  MessageScrollerScrollable,
  MessageScrollerVisibilityState,
}
