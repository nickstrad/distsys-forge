import type { MDXComponents } from "mdx/types";
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useState,
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from "react";

function childText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(childText).join("");
  }

  if (node && typeof node === "object" && "props" in node) {
    return childText((node.props as { children?: ReactNode }).children);
  }

  return "";
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function Heading({
  level,
  children,
  id,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & {
  level: 1 | 2 | 3 | 4;
}) {
  const Component = `h${level}` as "h1" | "h2" | "h3" | "h4";
  const anchor = id ?? slugify(childText(children));

  return (
    <Component id={anchor} {...props}>
      {level > 1 ? (
        <a className="heading-anchor" href={`#${anchor}`} aria-label="Link to this section">
          #
        </a>
      ) : null}
      {children}
    </Component>
  );
}

function SmartLink({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const external = props.href?.startsWith("http");

  return (
    <a
      {...props}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
      {external ? <span className="external-mark">↗</span> : null}
    </a>
  );
}

type CalloutTone = "note" | "idea" | "warning" | "system";

export function Callout({
  tone = "note",
  title,
  children,
}: PropsWithChildren<{ tone?: CalloutTone; title?: string }>) {
  const labels: Record<CalloutTone, string> = {
    note: "Field note",
    idea: "Working idea",
    warning: "Watch the edge",
    system: "System behavior",
  };

  return (
    <aside className={`callout callout--${tone}`}>
      <div className="callout__label">{title ?? labels[tone]}</div>
      <div className="callout__body">{children}</div>
    </aside>
  );
}

export function StudyPrompt({
  question,
  children,
  label = "Reveal a hint",
}: PropsWithChildren<{ question: string; label?: string }>) {
  return (
    <section className="study-prompt">
      <p className="study-prompt__eyebrow">Pause &amp; reason</p>
      <h3>{question}</h3>
      <details>
        <summary>{label}</summary>
        <div className="study-prompt__answer">{children}</div>
      </details>
    </section>
  );
}

export function KeyPoint({
  label = "Key point",
  children,
}: PropsWithChildren<{ label?: string }>) {
  return (
    <div className="key-point">
      <span>{label}</span>
      <div>{children}</div>
    </div>
  );
}

export function Steps({ children }: PropsWithChildren) {
  return <ol className="study-steps">{children}</ol>;
}

export function Step({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <li>
      <div className="study-step__marker" aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <div>{children}</div>
      </div>
    </li>
  );
}

export function Compare({ children }: PropsWithChildren) {
  return <div className="compare-grid">{children}</div>;
}

export function CompareItem({
  title,
  eyebrow,
  children,
}: PropsWithChildren<{ title: string; eyebrow?: string }>) {
  return (
    <section className="compare-card">
      {eyebrow ? <span>{eyebrow}</span> : null}
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}

type TaskProps = PropsWithChildren<{ title: string; id?: string }>;

// Task renders nothing on its own; TaskList reads its props and owns the markup.
export function Task(_props: TaskProps): null {
  return null;
}

export function TaskList({ children }: PropsWithChildren) {
  const tasks = Children.toArray(children).filter(isValidElement) as ReactElement<TaskProps>[];

  return (
    <section className="task-list">
      <header className="task-list__header">
        <span className="task-list__eyebrow">Implementation tasks</span>
      </header>
      <ol className="task-list__items">
        {tasks.map((task, index) => (
          <li key={task.props.id ?? (slugify(task.props.title) || index)}>
            <span className="task__body">
              <strong>{task.props.title}</strong>
              {task.props.children ? <span>{task.props.children}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

type HintProps = PropsWithChildren<{ title: string; check?: ReactNode }>;

// Hint renders nothing on its own; HintSteps reads its props and owns the markup.
export function Hint(_props: HintProps): null {
  return null;
}

export function HintSteps({ children }: PropsWithChildren) {
  const hints = Children.toArray(children).filter(isValidElement) as ReactElement<HintProps>[];
  const [revealed, setRevealed] = useState(0);

  return (
    <section className="hint-steps">
      <header className="hint-steps__header">
        <span className="hint-steps__eyebrow">Progressive hints</span>
        <span className="hint-steps__count">
          {revealed} of {hints.length} revealed
        </span>
      </header>
      <p className="hint-steps__note">
        Consult these only when blocked. Hints unlock in order so a later hint cannot
        spoil an earlier task.
      </p>
      <ol className="hint-steps__items">
        {hints.map((hint, index) => {
          const open = index < revealed;
          return (
            <li key={index} className={open ? "hint--open" : "hint--locked"}>
              <div className="hint__title">
                <span className="hint__number">{index + 1}</span>
                <span>{hint.props.title}</span>
              </div>
              {open ? (
                <div className="hint__body">
                  {hint.props.children}
                  {hint.props.check ? (
                    <p className="hint__check">
                      <strong>Back on track when:</strong> {hint.props.check}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
      <div className="hint-steps__controls">
        {revealed < hints.length ? (
          <button type="button" onClick={() => setRevealed((count) => count + 1)}>
            Reveal hint {revealed + 1}
          </button>
        ) : null}
        {revealed > 0 ? (
          <button
            type="button"
            className="hint-steps__reset"
            onClick={() => setRevealed(0)}
          >
            Hide all
          </button>
        ) : null}
      </div>
    </section>
  );
}

type ResourceKind = "docs" | "article" | "book" | "video" | "paper";

const resourceKindLabels: Record<ResourceKind, string> = {
  docs: "Docs",
  article: "Article",
  book: "Book",
  video: "Video",
  paper: "Paper",
};

export function Resources({ children }: PropsWithChildren) {
  return <ul className="resource-list">{children}</ul>;
}

export function Resource({
  kind = "article",
  title,
  href,
  by,
  children,
}: PropsWithChildren<{
  kind?: ResourceKind;
  title: string;
  href?: string;
  by?: string;
}>) {
  return (
    <li className={`resource resource--${kind}`}>
      <span className="resource__kind">{resourceKindLabels[kind]}</span>
      <div className="resource__body">
        <span className="resource__title">
          {href ? (
            <a href={href} target="_blank" rel="noreferrer">
              {title}
              <span className="external-mark">↗</span>
            </a>
          ) : (
            title
          )}
          {by ? <span className="resource__by"> — {by}</span> : null}
        </span>
        {children ? <span className="resource__note">{children}</span> : null}
      </div>
    </li>
  );
}

export function Figure({
  caption,
  children,
}: PropsWithChildren<{ caption?: string }>) {
  return (
    <figure className="doc-figure">
      <div className="doc-figure__canvas">{children}</div>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

// The mermaid module is imported lazily inside the effect so documents without
// diagrams never pay for the library in their initial chunk.
let mermaidReady: Promise<typeof import("mermaid")["default"]> | null = null;

// The palette in styles.css is expressed in oklch() with a calc()-derived hue,
// so a custom property's raw text is unusable to mermaid (its color parser only
// speaks hex/rgb/hsl). Resolving through a probe element makes the browser do
// the substitution and arithmetic; the result is then hand-converted to hex.
function oklchToHex(l: number, c: number, hDeg: number): string {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const lc = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mc = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sc = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
    -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
    -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc,
  ];
  return `#${lin
    .map((v) => {
      const srgb =
        v <= 0.0031308 ? 12.92 * v : 1.055 * Math.abs(v) ** (1 / 2.4) - 0.055;
      const byte = Math.max(0, Math.min(255, Math.round(srgb * 255)));
      return byte.toString(16).padStart(2, "0");
    })
    .join("")}`;
}

function readPaletteColor(probe: HTMLElement, name: string, fallback: string) {
  probe.style.color = "";
  probe.style.color = `var(${name})`;
  const resolved = getComputedStyle(probe).color.trim();
  if (!resolved || resolved === "rgba(0, 0, 0, 0)") return fallback;
  const oklch = resolved.match(
    /^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.-]+)(?:deg)?/i,
  );
  if (!oklch) return resolved; // already an rgb()/hex mermaid can parse
  const pct = (raw: string, scale: number) =>
    raw.endsWith("%") ? (parseFloat(raw) / 100) * scale : parseFloat(raw);
  return oklchToHex(pct(oklch[1], 1), pct(oklch[2], 0.4), parseFloat(oklch[3]));
}

function loadMermaid() {
  mermaidReady ??= import("mermaid").then(({ default: mermaid }) => {
    const probe = document.createElement("span");
    probe.style.cssText =
      "position:fixed;left:-9999px;top:0;width:0;height:0;pointer-events:none";
    document.body.appendChild(probe);
    const token = (name: string, fallback: string) =>
      readPaletteColor(probe, name, fallback);
    const ink = token("--ink", "#18231f");
    const accent = token("--accent", "#cf5436");
    const gold = token("--gold", "#caa552");
    // Lighter tints of --paper / --gold; see the matching tokens in styles.css.
    const paperTint = token("--paper-tint", "#f6f1e7");
    const paperLift = token("--paper-lift", "#faf7f0");
    const goldWash = token("--gold-wash", "#f3e9d2");
    probe.remove();
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      fontFamily: "inherit",
      themeVariables: {
        primaryColor: paperTint,
        primaryTextColor: ink,
        primaryBorderColor: ink,
        lineColor: accent,
        secondaryColor: paperTint,
        tertiaryColor: paperLift,
        noteBkgColor: goldWash,
        noteBorderColor: gold,
        actorBorder: ink,
        actorBkg: paperTint,
        signalColor: ink,
        signalTextColor: ink,
        labelBoxBkgColor: goldWash,
        labelBoxBorderColor: gold,
        activationBorderColor: gold,
        activationBkgColor: paperLift,
        clusterBkg: paperLift,
        clusterBorder: gold,
        edgeLabelBackground: paperLift,
      },
    });
    return mermaid;
  });
  return mermaidReady;
}

// Layout is the expensive part of mermaid.render, so finished renders are
// cached by source; remounting a document (or StrictMode's doubled effect)
// reuses the in-flight or completed promise instead of laying out again.
const mermaidRenders = new Map<string, Promise<string>>();

function renderMermaid(id: string, source: string) {
  let render = mermaidRenders.get(source);
  if (!render) {
    render = loadMermaid()
      .then((mermaid) => mermaid.render(id, source))
      .then((result) => result.svg);
    render.catch(() => mermaidRenders.delete(source));
    mermaidRenders.set(source, render);
  }
  return render;
}

export function Mermaid({ code, caption }: { code: string; caption?: string }) {
  const id = useId();
  const [result, setResult] = useState<
    { svg: string } | { error: string } | null
  >(null);

  const source = code.trim();
  useEffect(() => {
    let cancelled = false;
    renderMermaid(`mermaid-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`, source)
      .then((svg) => {
        if (!cancelled) setResult({ svg });
      })
      .catch((renderError: unknown) => {
        if (!cancelled) setResult({ error: String(renderError) });
      });
    return () => {
      cancelled = true;
    };
  }, [id, source]);

  if (result && "error" in result) {
    return (
      <Figure caption="This diagram failed to render; its source has a syntax error.">
        <pre>{result.error}</pre>
      </Figure>
    );
  }

  return (
    <Figure caption={caption}>
      <div
        // Mermaid's output is an SVG string it generated itself from the code
        // prop; nothing user-supplied at runtime reaches this sink.
        dangerouslySetInnerHTML={{ __html: result ? result.svg : "" }}
      />
    </Figure>
  );
}

export const mdxComponents: MDXComponents = {
  h1: (props) => <Heading level={1} {...props} />,
  h2: (props) => <Heading level={2} {...props} />,
  h3: (props) => <Heading level={3} {...props} />,
  h4: (props) => <Heading level={4} {...props} />,
  a: SmartLink,
  table: (props) => (
    <div className="table-scroll">
      <table {...props} />
    </div>
  ),
  pre: (props) => (
    <div className="code-frame">
      <span className="code-frame__label">working notes</span>
      <pre {...props} />
    </div>
  ),
  blockquote: (props) => <blockquote className="document-quote" {...props} />,
  Callout,
  StudyPrompt,
  KeyPoint,
  Steps,
  Step,
  Compare,
  CompareItem,
  TaskList,
  Task,
  HintSteps,
  Hint,
  Figure,
  Mermaid,
  Resources,
  Resource,
};
