// ProfileSection.tsx — Displays and edits a Wavelength user's profile details. Use in account settings and personal finance onboarding.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const profileSectionVariants = cva(
  "rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-[var(--space-6)] font-[var(--font-body)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]",
  {
    variants: {},
  }
);

export interface ProfileUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl: string;
}

export interface ProfileSectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof profileSectionVariants> {
  user: ProfileUser;
  isEditing: boolean;
  isLoading?: boolean;
  error?: string;
  onEdit?: () => void;
  onSave?: (updatedUser: ProfileUser) => void;
  onCancel?: () => void;
}

export default function ProfileSection({
  className,
  user,
  isEditing,
  isLoading = false,
  error,
  onEdit,
  onSave,
  onCancel,
  ...props
}: ProfileSectionProps) {
  const [draftUser, setDraftUser] = React.useState<ProfileUser>(user);

  React.useEffect(() => {
    setDraftUser(user);
  }, [user]);

  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  const updateField = (field: keyof ProfileUser, value: string) => {
    setDraftUser((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave?.(draftUser);
  };

  return (
    <section
      className={cn(profileSectionVariants(), className)}
      aria-busy={isLoading}
      {...props}
    >
      <div className="flex flex-col gap-[var(--space-6)]">
        <div className="flex items-start justify-between gap-[var(--space-4)]">
          <div className="flex min-w-0 items-center gap-[var(--space-4)]">
            <div className="flex h-[var(--control-lg)] w-[var(--control-lg)] shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-accent-50)] font-[var(--font-display)] text-[var(--color-accent-600)]">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={`${fullName} profile`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span aria-hidden="true">{initials}</span>
              )}
            </div>

            <div className="min-w-0">
              <h2 className="truncate font-[var(--font-display)] text-[var(--text-xl)] font-[var(--weight-semibold)]">
                {fullName}
              </h2>
              <p className="truncate text-[var(--text-base)] text-[var(--color-text-secondary)]">
                {user.email}
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={onEdit}
              disabled={!onEdit || isLoading}
              className="inline-flex h-[var(--control-md)] shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-default)] px-[var(--space-4)] font-[var(--weight-medium)] text-[var(--text-base)] text-[var(--color-text-primary)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Edit profile
            </button>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-[var(--radius-md)] border border-[var(--color-danger-500)] bg-[var(--color-danger-50)] px-[var(--space-4)] py-[var(--space-3)] text-[var(--text-base)] text-[var(--color-danger-900)]"
          >
            {error}
          </div>
        )}

        {isEditing && (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-[var(--space-4)] border-t border-[var(--color-border-subtle)] pt-[var(--space-6)]"
          >
            <div className="grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2">
              <label className="flex flex-col gap-[var(--space-2)]">
                <span className="text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-secondary)]">
                  First name
                </span>
                <input
                  id={`${user.id}-first-name`}
                  name="firstName"
                  type="text"
                  value={draftUser.firstName}
                  onChange={(event) => updateField("firstName", event.target.value)}
                  disabled={isLoading}
                  required
                  className="h-[var(--control-lg)] rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-[var(--space-4)] text-[var(--text-base)] text-[var(--color-text-primary)] outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-neutral-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                />
              </label>

              <label className="flex flex-col gap-[var(--space-2)]">
                <span className="text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-secondary)]">
                  Last name
                </span>
                <input
                  id={`${user.id}-last-name`}
                  name="lastName"
                  type="text"
                  value={draftUser.lastName}
                  onChange={(event) => updateField("lastName", event.target.value)}
                  disabled={isLoading}
                  required
                  className="h-[var(--control-lg)] rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-[var(--space-4)] text-[var(--text-base)] text-[var(--color-text-primary)] outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-neutral-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                />
              </label>
            </div>

            <label className="flex flex-col gap-[var(--space-2)]">
              <span className="text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-secondary)]">
                Email
              </span>
              <input
                id={`${user.id}-email`}
                name="email"
                type="email"
                value={draftUser.email}
                onChange={(event) => updateField("email", event.target.value)}
                disabled={isLoading}
                required
                className="h-[var(--control-lg)] rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-[var(--space-4)] text-[var(--text-base)] text-[var(--color-text-primary)] outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-neutral-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              />
            </label>

            <label className="flex flex-col gap-[var(--space-2)]">
              <span className="text-[var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text-secondary)]">
                Phone <span className="font-[var(--weight-regular)] text-[var(--color-text-muted)]">(optional)</span>
              </span>
              <input
                id={`${user.id}-phone`}
                name="phone"
                type="tel"
                value={draftUser.phone ?? ""}
                onChange={(event) => updateField("phone", event.target.value)}
                disabled={isLoading}
                className="h-[var(--control-lg)] rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] px-[var(--space-4)] text-[var(--text-base)] text-[var(--color-text-primary)] outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:border-[var(--color-neutral-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              />
            </label>

            <div className="flex flex-wrap justify-end gap-[var(--space-3)] pt-[var(--space-2)]">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading || !onCancel}
                className="h-[var(--control-md)] rounded-[var(--radius-md)] px-[var(--space-4)] font-[var(--weight-medium)] text-[var(--text-base)] text-[var(--color-text-secondary)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading || !onSave}
                aria-busy={isLoading}
                className="inline-flex h-[var(--control-md)] items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] bg-[var(--color-accent-500)] px-[var(--space-4)] font-[var(--weight-medium)] text-[var(--text-base)] text-[var(--color-text-inverse)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--color-accent-600)] active:bg-[var(--color-accent-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                {isLoading && (
                  <svg
                    className="h-[var(--space-4)] w-[var(--space-4)] animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                )}
                Save changes
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}