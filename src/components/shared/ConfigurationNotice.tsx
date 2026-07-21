import { AlertCircle, LoaderCircle, Settings } from "lucide-react";

type ConfigurationNoticeVariant = "loading" | "configuration" | "error";

type ConfigurationNoticeProps = {
  title: string;
  message: string;
  variant?: ConfigurationNoticeVariant;
  action?: {
    label: string;
    href: string;
  };
};

const iconByVariant = {
  configuration: Settings,
  error: AlertCircle,
  loading: LoaderCircle,
} satisfies Record<ConfigurationNoticeVariant, typeof AlertCircle>;

export function ConfigurationNotice({
  action,
  message,
  title,
  variant = "configuration",
}: ConfigurationNoticeProps) {
  const Icon = iconByVariant[variant];

  return (
    <section className={`configuration-notice configuration-notice-${variant}`} role="status">
      <div className="configuration-notice-icon">
        <Icon aria-hidden="true" className={variant === "loading" ? "spin-icon" : undefined} size={24} />
      </div>
      <div>
        <h1>{title}</h1>
        <p>{message}</p>
        {action ? (
          <a className="notice-action" href={action.href}>
            {action.label}
          </a>
        ) : null}
      </div>
    </section>
  );
}
