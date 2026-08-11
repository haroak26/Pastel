"use client"

import { useMemo } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Clock, Mail, Reply, Users } from "lucide-react"

import { cn } from "./cn"
import { Label } from "./label"
import { Separator } from "./separator"
import { Input } from "./input"

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-5 has-[>[data-slot=checkbox-group]]:gap-4 has-[>[data-slot=radio-group]]:gap-4",
        className
      )}
      {...props}
    />
  )
}

function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "mb-2 font-heading font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base",
        className
      )}
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-6 data-[slot=checkbox-group]:gap-4 *:data-[slot=field-group]:gap-5",
        className
      )}
      {...props}
    />
  )
}

const fieldVariants = cva(
  "group/field flex w-full gap-2.5 data-[invalid=true]:text-destructive",
  {
    variants: {
      orientation: {
        vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
        horizontal:
          "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        "group/field-content flex flex-1 flex-col gap-1 leading-snug",
        className
      )}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5 has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border *:data-[slot=field]:p-3 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-2 text-sm font-medium group-data-[disabled=true]/field:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-left text-sm leading-normal font-normal text-muted-foreground group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-2",
        "last:mt-0 nth-last-2:-mt-1.5",
        "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className
      )}
      {...props}
    />
  )
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "relative -my-2.5 h-6 text-sm group-data-[variant=outline]/field-group:-mb-2.5",
        className
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="relative mx-auto block w-fit bg-background px-3 text-muted-foreground"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  )
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>
}) {
  const content = useMemo(() => {
    if (children) {
      return children
    }

    if (!errors?.length) {
      return null
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ]

    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message
    }

    return (
      <ul className="ml-5 flex list-disc flex-col gap-1.5">
        {uniqueErrors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>
        )}
      </ul>
    )
  }, [children, errors])

  if (!content) {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-sm font-normal text-destructive", className)}
      {...props}
    >
      {content}
    </div>
  )
}

export function SettingsForm({
  teamName,
  email,
  replyTo,
  timezone,
  className,
}: {
  teamName: string
  email: string
  replyTo: string
  timezone: string
  className?: string
}) {
  return (
    <form className={cn("w-full max-w-md space-y-8", className)}>
      <FieldSet>
        <FieldLegend className="text-lg">Team identity</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="team-name" className="text-sm font-medium">
              <Users className="size-4 text-muted-foreground" aria-hidden="true" />
              Team name
            </FieldLabel>
            <FieldContent>
              <Input
                id="team-name"
                name="teamName"
                defaultValue={teamName}
                placeholder="e.g. Acme Support"
                className="h-10 rounded-md border-border bg-background"
                required
              />
              <FieldDescription>
                Shown to customers when you reply from the shared inbox.
              </FieldDescription>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend className="text-lg">Email routing</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="support-email" className="text-sm font-medium">
              <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
              Support email
            </FieldLabel>
            <FieldContent>
              <Input
                id="support-email"
                name="email"
                type="email"
                defaultValue={email}
                placeholder="support@yourdomain.com"
                className="h-10 rounded-md border-border bg-background"
                required
              />
              <FieldDescription>
                The address where new tickets are delivered.
              </FieldDescription>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="reply-to" className="text-sm font-medium">
              <Reply className="size-4 text-muted-foreground" aria-hidden="true" />
              Reply-to address
            </FieldLabel>
            <FieldContent>
              <Input
                id="reply-to"
                name="replyTo"
                type="email"
                defaultValue={replyTo}
                placeholder="replies@yourdomain.com"
                className="h-10 rounded-md border-border bg-background"
                required
              />
              <FieldDescription>
                Where customer replies are sent when you respond from Meridian.
              </FieldDescription>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend className="text-lg">Response timing</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="timezone" className="text-sm font-medium">
              <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
              Team timezone
            </FieldLabel>
            <FieldContent>
              <Input
                id="timezone"
                name="timezone"
                defaultValue={timezone}
                placeholder="America/Los_Angeles"
                className="h-10 rounded-md border-border bg-background font-mono text-sm"
                required
              />
              <FieldDescription>
                Used to calculate response-time targets and SLA timers on tickets.
              </FieldDescription>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  )
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
}