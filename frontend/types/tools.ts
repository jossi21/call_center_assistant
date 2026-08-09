import { Tool } from "@/services/toolsApi";

export interface ParamRow {
  name: string;
  type: "string" | "number" | "boolean";
  description: string;
  required: boolean;
}

export interface JsonSchemaProperty {
  type?: string;
  description?: string;
}

export interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

export interface ActionConfig {
  method?: string;
  url?: string;
  field?: string;
  memory_key?: string;
}

export type ToolFormData = Partial<Tool>;
