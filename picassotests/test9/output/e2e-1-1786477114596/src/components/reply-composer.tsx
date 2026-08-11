import * as React from "react"
import { Bold, Italic, Link, List, ListOrdered, Send, Underline } from "lucide-react"

import { cn } from "./cn"
import { Button } from "./button"

interface ReplyComposerProps extends React.ComponentProps<"textarea"> {
  /** Callback fired when the reply is sent with the current content */
  onSend: (content: string) => void
  /** Placeholder text shown when the composer is empty */
  placeholder?: string
}

function ReplyComposer({ className, onSend, placeholder = "Type your reply…", ...props }: ReplyComposerProps) {
  const [content, setContent] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    if (!content.trim() || isLoading) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      await onSend(content)
      setContent("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  const execFormat = (command: string, value?: string) => {
    textareaRef.current?.focus()
    document.execCommand(command, false, value)
  }

  const toolbarButtonClass = "h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      <div className="flex items-center justify-between rounded-t-md border border-b-0 border-border bg-card px-3 py-2">
        <div className="flex items-center gap-1" role="toolbar" aria-label="Formatting options">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={toolbarButtonClass}
            onClick={() => execFormat("bold")}
            aria-label="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={toolbarButtonClass}
            onClick={() => execFormat("italic")}
            aria-label="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={toolbarButtonClass}
            onClick={() => execFormat("underline")}
            aria-label="Underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={toolbarButtonClass}
            onClick={() => execFormat("insertUnorderedList")}
            aria-label="Bullet list"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={toolbarButtonClass}
            onClick={() => execFormat("insertOrderedList")}
            aria-label="Numbered list"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={toolbarButtonClass}
            onClick={() => execFormat("createLink", "https://")}
            aria-label="Insert link"
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">
          <kbd className="rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘</kbd>
          <kbd className="ml-0.5 rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
          {" "}to send
        </span>
      </div>

      <textarea
        ref={textareaRef}
        data-slot="reply-composer"
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          if (error) setError(null)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? "reply-composer-error" : undefined}
        className={cn(
          "flex field-sizing-content min-h-32 w-full rounded-md border border-border bg-transparent p-3 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          error && "border-destructive"
        )}
        {...props}
      />

      {error && (
        <p id="reply-composer-error" className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {content.length > 0 && `${content.length} characters`}
        </span>
        <Button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() || isLoading}
          className="h-10 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" aria-hidden="true" />
              Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden="true" />
              Send Reply
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export { ReplyComposer }
export { Textarea }