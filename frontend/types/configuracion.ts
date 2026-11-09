export type ConfiguracionKey =
  | "system.name"
  | "system.timezone"
  | "system.currency"
  | "reports.company_name"
  | "reports.footer";

export interface ConfiguracionItem {
  key: ConfiguracionKey;
  label: string;
  description: string;
  defaultValue: string;
  value: string;
}

export interface ConfiguracionResponse {
  data: ConfiguracionItem[];
}
