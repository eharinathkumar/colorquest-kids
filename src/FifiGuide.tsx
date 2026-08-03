import {
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { SpeakButton } from "./SpeechProvider";
import "./FifiGuide.css";

type SharedGuideProps = {
  open: boolean;
  /** Supply `/fifi-mascot.png` after the finished local mascot art is added. */
  mascotSrc?: string;
  childName?: string;
  className?: string;
};

export type FifiGuideProps = SharedGuideProps & (
  | {
    mode: "leave-drawing";
    onStay: () => void;
    onLeave: () => void;
    title?: string;
    message?: string;
  }
  | {
    mode: "start-over";
    onCancel: () => void;
    onStartOver: () => void;
    title?: string;
    message?: string;
  }
  | {
    mode: "tip";
    message: string;
    onDismiss: () => void;
    title?: string;
    actionLabel?: string;
    onAction?: () => void;
  }
);

type GuideCopy = {
  title: string;
  message: string;
  listenText: string;
};

function copyFor(props: FifiGuideProps): GuideCopy {
  const hello = props.childName ? `, ${props.childName}` : "";

  if (props.mode === "leave-drawing") {
    const title = props.title || `Your picture is safe${hello}!`;
    const message = props.message
      || "I save a private draft on this device while you create. You can leave now and come back to finish it later.";
    return { title, message, listenText: `${title} ${message}` };
  }

  if (props.mode === "start-over") {
    const title = props.title || "Start a fresh page?";
    const message = props.message
      || "This will clear this drawing and cannot be undone. Save it to My Gallery first if you want to keep a copy.";
    return { title, message, listenText: `${title} ${message}` };
  }

  const title = props.title || `A bright idea from Fifi${hello}`;
  return { title, message: props.message, listenText: `${title}. ${props.message}` };
}

function FifiMascot({ src }: { src?: string }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [src]);

  if (src && !imageFailed) {
    return (
      <img
        className="fifi-mascot-image"
        src={src}
        alt="Fifi, your ColorQuest guide"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span className="fifi-mascot-placeholder" role="img" aria-label="Fifi, your ColorQuest guide">
      🦊
    </span>
  );
}

function GuideButton({
  children,
  className = "",
  onClick,
  buttonRef,
}: {
  children: ReactNode;
  className?: string;
  onClick: () => void;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <button ref={buttonRef} type="button" className={`fifi-button ${className}`.trim()} onClick={onClick}>
      {children}
    </button>
  );
}

/**
 * Fifi's reusable coaching surface.
 *
 * Leave and start-over modes are accessible blocking dialogs. Their Escape,
 * backdrop and initial-focus actions always choose the safe, non-destructive
 * path. Tip mode is a non-blocking status card: the child can keep creating
 * without first dismissing it.
 */
export default function FifiGuide(props: FifiGuideProps) {
  const { open, mascotSrc, className = "" } = props;
  const copy = copyFor(props);
  const rawId = useId();
  const stableId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const titleId = `fifi-title-${stableId}`;
  const descriptionId = `fifi-description-${stableId}`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const safeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const safeCloseRef = useRef<() => void>(() => undefined);
  const blocking = props.mode !== "tip";

  safeCloseRef.current = props.mode === "leave-drawing"
    ? props.onStay
    : props.mode === "start-over"
      ? props.onCancel
      : props.onDismiss;

  useEffect(() => {
    if (!open || !blocking) return undefined;

    restoreFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => safeButtonRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        safeCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) || []).filter((element) => !element.hasAttribute("hidden"));
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [blocking, open]);

  if (!open || typeof document === "undefined") return null;

  const mascot = <FifiMascot src={mascotSrc} />;
  const listen = (
    <SpeakButton
      id={`fifi-${props.mode}-${stableId}`}
      text={copy.listenText}
      label="Hear Fifi"
      className="fifi-listen"
    />
  );

  if (props.mode === "tip") {
    return createPortal(
      <aside
        className={`fifi-tip-wrap ${className}`.trim()}
        role="note"
        aria-label="Fifi's tip"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="fifi-tip">
          <div className="fifi-mascot fifi-mascot-small">{mascot}</div>
          <div className="fifi-tip-copy">
            <strong>{copy.title}</strong>
            <p>{copy.message}</p>
            <div className="fifi-tip-actions">
              {listen}
              {props.actionLabel && props.onAction && (
                <GuideButton className="fifi-button-small" onClick={props.onAction}>
                  {props.actionLabel}
                </GuideButton>
              )}
            </div>
          </div>
          <button type="button" className="fifi-tip-close" onClick={props.onDismiss} aria-label="Dismiss Fifi's tip">
            ×
          </button>
        </div>
      </aside>,
      document.body,
    );
  }

  const safeAction = props.mode === "leave-drawing" ? props.onStay : props.onCancel;
  const safeLabel = props.mode === "leave-drawing" ? "Stay & draw" : "Keep my picture";
  const confirmAction = props.mode === "leave-drawing" ? props.onLeave : props.onStartOver;
  const confirmLabel = props.mode === "leave-drawing" ? "Keep it safe and leave" : "Start a fresh page";
  const destructive = props.mode === "start-over";

  const closeFromBackdrop = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) safeAction();
  };

  return createPortal(
    <div className="fifi-layer" onMouseDown={closeFromBackdrop}>
      <div
        ref={dialogRef}
        className={`fifi-dialog ${destructive ? "fifi-dialog-warning" : ""} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <div className="fifi-mascot" aria-hidden="true">{mascot}</div>
        <div className="fifi-dialog-copy">
          <p className="fifi-kicker">Fifi says</p>
          <h2 id={titleId}>{copy.title}</h2>
          <p id={descriptionId}>{copy.message}</p>
          {listen}
          <div className="fifi-actions">
            <GuideButton buttonRef={safeButtonRef} className="fifi-button-safe" onClick={safeAction}>
              {safeLabel}
            </GuideButton>
            <GuideButton className={destructive ? "fifi-button-danger" : "fifi-button-primary"} onClick={confirmAction}>
              {confirmLabel}
            </GuideButton>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
