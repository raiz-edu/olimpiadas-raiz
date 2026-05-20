"use client";

type ConfirmButtonProps = {
  message: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Submit button that shows a native confirm() dialog before submitting.
 * Must be placed inside a <form>.
 */
export function ConfirmButton({ message, className, children }: ConfirmButtonProps) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
