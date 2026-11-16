import type {
  AgentBuiltinToolEntry,
  ManagedAgent,
  ManagedAgentCreateParams,
  ManagedWidgetBusinessConfiguration,
  ManagedWidgetConfig,
  ManagedWidgetCreateParams,
  ManagedWidgetUpdateParams,
  WidgetAnalytics,
  WidgetPosition,
  WidgetTheme,
  WidgetType,
} from "../types.js";

type RecordValue = Record<string, unknown>;
const object = (value: unknown): RecordValue =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function exactObject(value: unknown, allowed: readonly string[], message: string): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(message);
  const record = value as RecordValue;
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) {
      if (["model", "llmConfigId", "fallbackLlmConfigId", "runtimeKind", "runtimeProfileId", "runtimeConnectionId", "runtimePreferences", "mcpServers", "llmModel", "llmSource", "humanEscalation"].includes(key)) {
        throw new TypeError(message);
      }
      throw new TypeError(`Managed contract does not accept ${key}`);
    }
  }
  return record;
}

const AGENT_FIELDS = ["name", "description", "collectionId", "resources", "systemPrompt", "instructions", "enabledBuiltinTools", "skillIds", "workflowToolIds"] as const;
const AGENT_UPDATE_FIELDS = [...AGENT_FIELDS, "isActive"] as const;

function presentBuiltinTools(value: unknown): AgentBuiltinToolEntry[] | null {
  if (!Array.isArray(value)) return null;
  const result: AgentBuiltinToolEntry[] = [];
  for (const raw of value) {
    if (typeof raw === "string") {
      result.push(raw);
      continue;
    }
    const item = object(raw);
    if (typeof item.id !== "string") continue;
    result.push({ id: item.id, ...(typeof item.humanInTheLoop === "boolean" ? { humanInTheLoop: item.humanInTheLoop } : {}) });
  }
  return result;
}

function projectAgent(value: unknown): ManagedAgent {
  const raw = object(value);
  const resources = Array.isArray(raw.resources) ? raw.resources.flatMap((item) => {
    const resource = object(item);
    return resource.type === "collection" && typeof resource.id === "string"
      ? [{ type: "collection" as const, id: resource.id,
          priority: typeof resource.priority === "number" ? resource.priority : 0,
          ...(typeof resource.name === "string" || resource.name === null ? { name: resource.name } : {}) }]
      : [];
  }) : undefined;
  return {
    id: typeof raw.id === "string" ? raw.id : "",
    name: typeof raw.name === "string" ? raw.name : "",
    description: typeof raw.description === "string" || raw.description === null ? raw.description : null,
    collectionId: typeof raw.collectionId === "string" || raw.collectionId === null ? raw.collectionId : null,
    ...(typeof raw.collectionName === "string" || raw.collectionName === null ? { collectionName: raw.collectionName } : {}),
    systemPrompt: typeof raw.systemPrompt === "string" || raw.systemPrompt === null ? raw.systemPrompt : null,
    instructions: typeof raw.instructions === "string" || raw.instructions === null ? raw.instructions : null,
    ...(resources ? { resources } : {}),
    enabledBuiltinTools: presentBuiltinTools(raw.enabledBuiltinTools),
    ...(Array.isArray(raw.skillIds) ? { skillIds: raw.skillIds.filter((item): item is string => typeof item === "string") } : {}),
    ...(Array.isArray(raw.workflowToolIds) ? { workflowToolIds: raw.workflowToolIds.filter((item): item is string => typeof item === "string") } : {}),
    isActive: raw.isActive === true,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : "",
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "",
  };
}

export function serializeManagedAgent(value: ManagedAgentCreateParams | Record<string, unknown>, requireName = false): string {
  const raw = exactObject(value, requireName ? AGENT_FIELDS : AGENT_UPDATE_FIELDS, "Managed agents cannot override provider or runtime configuration");
  const stringFields = ["name", "systemPrompt", "instructions", "description", "collectionId"] as const;
  for (const key of stringFields) {
    const item = raw[key];
    if (item === undefined) continue;
    if (item === null && !requireName && ["description", "systemPrompt", "instructions", "collectionId"].includes(key)) continue;
    if (typeof item !== "string") throw new TypeError(`${key} must be a string`);
    if (key === "name" && (item.trim().length === 0 || item.length > 100)) throw new TypeError("name must contain 1 to 100 characters");
    if (key === "description" && item.length > 500) throw new TypeError("description must be at most 500 characters");
    if (key === "collectionId" && !UUID.test(item)) throw new TypeError("collectionId must be a UUID");
  }
  if (requireName && typeof raw.name !== "string") throw new TypeError("name is required");
  if (raw.isActive !== undefined && typeof raw.isActive !== "boolean") throw new TypeError("isActive must be a boolean");
  const body: RecordValue = { ...raw };
  if (raw.resources !== undefined) {
    if (!Array.isArray(raw.resources) || raw.resources.length > 30) throw new TypeError("resources must contain at most 30 collection references");
    body.resources = raw.resources.map((item) => {
      const resource = exactObject(item, ["type", "id", "priority"], "Managed agent resources accept collection references only");
      if (resource.type !== "collection" || typeof resource.id !== "string" || !UUID.test(resource.id) ||
        (resource.priority !== undefined && (!Number.isInteger(resource.priority) || Number(resource.priority) < 0 || Number(resource.priority) > 100))) {
        throw new TypeError("Managed agent resources accept collection references only");
      }
      return { type: "collection", id: resource.id, ...(resource.priority === undefined ? {} : { priority: resource.priority }) };
    });
  }
  if (raw.enabledBuiltinTools !== undefined) body.enabledBuiltinTools = presentBuiltinToolsForRequest(raw.enabledBuiltinTools);
  for (const key of ["skillIds", "workflowToolIds"] as const) {
    if (raw[key] !== undefined && (!Array.isArray(raw[key]) || !raw[key].every((item) => typeof item === "string" && UUID.test(item)))) {
      throw new TypeError(`${key} must be an array of UUIDs`);
    }
  }
  return JSON.stringify(body);
}

function presentBuiltinToolsForRequest(value: unknown): AgentBuiltinToolEntry[] {
  if (!Array.isArray(value)) throw new TypeError("enabledBuiltinTools must be an array");
  return value.map((raw) => {
    if (typeof raw === "string") return raw;
    const item = exactObject(raw, ["id", "humanInTheLoop"], "Managed built-in tool settings accept only tool IDs and confirmation policy");
    if (typeof item.id !== "string" || (item.humanInTheLoop !== undefined && typeof item.humanInTheLoop !== "boolean")) {
      throw new TypeError("Managed built-in tools require a string ID");
    }
    return { id: item.id, ...(item.humanInTheLoop === undefined ? {} : { humanInTheLoop: item.humanInTheLoop }) };
  });
}

export const presentManagedAgent = projectAgent;

const WIDGET_CREATE_FIELDS = ["name", "type", "collectionId", "agentId", "workflowId", "workflowConfig", "allowedDomains", "theme", "position", "welcomeMessage", "placeholder", "suggestions", "avatarUrl", "displayMode", "locale", "headerTitle", "hidePoweredBy", "customCss", "rateLimitPerMinute", "sessionTtlMinutes"] as const;
const WIDGET_UPDATE_FIELDS = ["name", "workflowConfig", "allowedDomains", "theme", "position", "welcomeMessage", "placeholder", "suggestions", "avatarUrl", "displayMode", "locale", "headerTitle", "hidePoweredBy", "customCss", "rateLimitPerMinute", "sessionTtlMinutes", "isActive"] as const;
const BUSINESS_FIELDS = ["deepActivation", "deepModeLabel", "buttonLabel", "submitLabel", "successMessage", "errorMessage", "fieldOverrides", "maxDisplayedExecutions", "showNodeProgress", "showDuration", "showOutput"] as const;
const FIELD_OVERRIDE_KEYS = ["label", "placeholder", "helpText", "inputType", "options", "required"] as const;
const THEME_KEYS = ["preset", "primaryColor", "primaryTextColor", "backgroundColor", "textColor", "secondaryTextColor", "borderColor", "inputBackgroundColor", "fontFamily", "borderRadius", "shadow", "userMessageBackgroundColor", "userMessageTextColor", "assistantMessageBackgroundColor", "assistantMessageTextColor"] as const;
const POSITIONS: readonly WidgetPosition[] = ["bottom-right", "bottom-left", "top-right", "top-left"];
const TYPES: readonly WidgetType[] = ["collection", "agent", "workflow-button", "workflow-form", "workflow-webhook"];
const INPUT_TYPES = ["text", "textarea", "number", "email", "url", "password", "select", "checkbox", "date"] as const;

function presentBusinessConfig(value: unknown, strict: boolean): ManagedWidgetBusinessConfiguration | undefined {
  if (value == null) return undefined;
  const raw = strict ? exactObject(value, BUSINESS_FIELDS, "Managed widget configuration accepts business settings only") : object(value);
  const result: RecordValue = {};
  for (const key of BUSINESS_FIELDS) {
    const item = raw[key];
    if (item === undefined) continue;
    if (key === "fieldOverrides") {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        if (strict) throw new TypeError("fieldOverrides must be an object");
        continue;
      }
      if (strict && Object.keys(item as RecordValue).length > 64) throw new TypeError("fieldOverrides supports at most 64 fields");
      const overrides: RecordValue = {};
      for (const [name, config] of Object.entries(item as RecordValue).slice(0, 64)) {
        if (strict && name.length > 100) throw new TypeError("field override names must be at most 100 characters");
        const field = strict ? exactObject(config, FIELD_OVERRIDE_KEYS, "Managed widget field overrides accept supported UI fields only") : object(config);
        const safe: RecordValue = {};
        for (const fieldKey of FIELD_OVERRIDE_KEYS) {
          const child = field[fieldKey];
          if (fieldKey === "options" && Array.isArray(child)) {
            if (strict && child.length > 100) throw new TypeError("widget field options support at most 100 values");
            safe.options = child.slice(0, 100).flatMap((option) => {
              const optionRecord = strict ? exactObject(option, ["label", "value"], "Managed widget options accept label and value only") : object(option);
              if (typeof optionRecord.label === "string" && typeof optionRecord.value === "string" && optionRecord.value.length <= 1000) {
                return [{ label: optionRecord.label, value: optionRecord.value }];
              }
              if (strict) throw new TypeError("widget options require string labels and values up to 1000 characters");
              return [];
            });
          } else if (fieldKey === "options" && child !== undefined && strict) throw new TypeError("widget field options must be an array");
          else if (fieldKey === "inputType" && typeof child === "string" && (INPUT_TYPES as readonly string[]).includes(child)) safe.inputType = child;
          else if (["label", "placeholder", "helpText"].includes(fieldKey) && typeof child === "string") {
            const maximum = fieldKey === "helpText" ? 2000 : 500;
            if (strict && child.length > maximum) throw new TypeError(`${fieldKey} exceeds ${maximum} characters`);
            safe[fieldKey] = child;
          }
          else if (fieldKey === "required" && typeof child === "boolean") safe.required = child;
          else if (child !== undefined && strict) throw new TypeError(`Invalid widget field setting: ${fieldKey}`);
        }
        overrides[name] = safe;
      }
      result.fieldOverrides = overrides;
    } else if (["deepActivation"].includes(key) && (item === "disabled" || item === "visitor_allowed")) result[key] = item;
    else if (["deepModeLabel", "buttonLabel", "submitLabel", "successMessage", "errorMessage"].includes(key) && typeof item === "string") {
      const maximum = ["successMessage", "errorMessage"].includes(key) ? 2000 : 500;
      if (strict && item.length > maximum) throw new TypeError(`${key} exceeds ${maximum} characters`);
      result[key] = item;
    }
    else if (key === "maxDisplayedExecutions" && typeof item === "number" && Number.isInteger(item) && item >= 1 && item <= 50) result[key] = item;
    else if (["showNodeProgress", "showDuration", "showOutput"].includes(key) && typeof item === "boolean") result[key] = item;
    else if (strict) throw new TypeError(`Invalid managed widget business setting: ${key}`);
  }
  return result as ManagedWidgetBusinessConfiguration;
}

function presentTheme(value: unknown, strict = false): WidgetTheme | undefined {
  if (value == null) return undefined;
  const raw = strict ? exactObject(value, THEME_KEYS, "Managed widget theme accepts presentation fields only") : object(value);
  const result: RecordValue = {};
  for (const key of THEME_KEYS) {
    if (raw[key] === undefined) continue;
    if (key === "preset" && ["light", "dark", "auto"].includes(String(raw[key]))) result[key] = raw[key];
    else if (key !== "preset" && typeof raw[key] === "string") result[key] = raw[key];
    else if (strict) throw new TypeError(`Invalid managed widget theme field: ${key}`);
  }
  return result as WidgetTheme;
}

function serializeWidget(value: ManagedWidgetCreateParams | ManagedWidgetUpdateParams | Record<string, unknown>, create: boolean): string {
  const raw = exactObject(value, create ? WIDGET_CREATE_FIELDS : WIDGET_UPDATE_FIELDS, "Managed widgets cannot select a provider or include secret configuration");
  const body: RecordValue = { ...raw };
  for (const key of ["name", "collectionId", "agentId", "workflowId", "welcomeMessage", "placeholder", "avatarUrl"] as const) {
    if (raw[key] !== undefined && typeof raw[key] !== "string") throw new TypeError(`${key} must be a string`);
  }
  if (raw.name !== undefined && (!String(raw.name).trim() || String(raw.name).length > 100)) throw new TypeError("name must contain 1 to 100 characters");
  if (raw.welcomeMessage !== undefined && String(raw.welcomeMessage).length > 500) throw new TypeError("welcomeMessage must be at most 500 characters");
  if (raw.workflowId !== undefined && !UUID.test(String(raw.workflowId))) throw new TypeError("workflowId must be a UUID");
  if (raw.avatarUrl !== undefined) {
    try { new URL(String(raw.avatarUrl)); } catch { throw new TypeError("avatarUrl must be a valid URL"); }
  }
  for (const key of ["headerTitle", "customCss"] as const) {
    if (raw[key] !== undefined && raw[key] !== null && typeof raw[key] !== "string") throw new TypeError(`${key} must be a string or null`);
  }
  if (typeof raw.headerTitle === "string" && raw.headerTitle.length > 100) throw new TypeError("headerTitle must be at most 100 characters");
  if (typeof raw.customCss === "string" && raw.customCss.length > 20000) throw new TypeError("customCss must be at most 20000 characters");
  for (const key of ["hidePoweredBy", "isActive"] as const) {
    if (raw[key] !== undefined && typeof raw[key] !== "boolean") throw new TypeError(`${key} must be a boolean`);
  }
  if (raw.displayMode !== undefined && raw.displayMode !== "support" && raw.displayMode !== "debug") throw new TypeError("Invalid displayMode");
  if (raw.locale !== undefined && raw.locale !== null && raw.locale !== "fr" && raw.locale !== "en") throw new TypeError("Invalid locale");
  if (raw.rateLimitPerMinute !== undefined && (!Number.isInteger(raw.rateLimitPerMinute) || Number(raw.rateLimitPerMinute) < 1 || Number(raw.rateLimitPerMinute) > 60)) throw new TypeError("rateLimitPerMinute must be an integer from 1 to 60");
  if (raw.sessionTtlMinutes !== undefined && (!Number.isInteger(raw.sessionTtlMinutes) || Number(raw.sessionTtlMinutes) < 5 || Number(raw.sessionTtlMinutes) > 120)) throw new TypeError("sessionTtlMinutes must be an integer from 5 to 120");
  if (raw.workflowConfig !== undefined) {
    if (raw.workflowConfig === null) throw new TypeError("Managed widget configuration must be an object");
    body.workflowConfig = presentBusinessConfig(raw.workflowConfig, true);
  }
  if (raw.theme !== undefined) {
    if (raw.theme === null) throw new TypeError("Managed widget theme must be an object");
    body.theme = presentTheme(raw.theme, true);
  }
  if (raw.suggestions !== undefined) {
    if (!Array.isArray(raw.suggestions) || raw.suggestions.length > 5 || raw.suggestions.some((item) => {
      const entry = exactObject(item, ["title", "prompt"], "Managed widget suggestions accept title and prompt only");
      return typeof entry.title !== "string" || typeof entry.prompt !== "string";
    })) throw new TypeError("Managed widget suggestions require title and prompt");
    body.suggestions = raw.suggestions.map((item) => ({ title: item.title, prompt: item.prompt }));
  }
  if (raw.allowedDomains !== undefined && (!Array.isArray(raw.allowedDomains) || !raw.allowedDomains.every((item) => typeof item === "string"))) throw new TypeError("allowedDomains must be an array of strings");
  if (raw.position !== undefined && !(POSITIONS as readonly unknown[]).includes(raw.position)) throw new TypeError("Invalid widget position");
  if (raw.type !== undefined && !(TYPES as readonly unknown[]).includes(raw.type)) throw new TypeError("Invalid widget type");
  if (create && (typeof raw.name !== "string" || !raw.name.trim() || typeof raw.type !== "string")) throw new TypeError("Managed widgets require a name and type");
  return JSON.stringify(body);
}

function presentWidget(value: unknown): ManagedWidgetConfig {
  const raw = object(value);
  const suggestions = Array.isArray(raw.suggestions) ? raw.suggestions.flatMap((item) => {
    const entry = object(item);
    return typeof entry.title === "string" && typeof entry.prompt === "string" ? [{ title: entry.title, prompt: entry.prompt }] : [];
  }) : null;
  return {
    id: typeof raw.id === "string" ? raw.id : "",
    name: typeof raw.name === "string" ? raw.name : "",
    type: (TYPES as readonly unknown[]).includes(raw.type) ? raw.type as WidgetType : "collection",
    collectionId: typeof raw.collectionId === "string" || raw.collectionId === null ? raw.collectionId : null,
    agentId: typeof raw.agentId === "string" || raw.agentId === null ? raw.agentId : null,
    workflowId: typeof raw.workflowId === "string" || raw.workflowId === null ? raw.workflowId : null,
    workflowConfig: presentBusinessConfig(raw.workflowConfig, false) ?? null,
    keyPrefix: typeof raw.keyPrefix === "string" ? raw.keyPrefix : "",
    allowedDomains: Array.isArray(raw.allowedDomains) ? raw.allowedDomains.filter((item): item is string => typeof item === "string") : [],
    theme: presentTheme(raw.theme) ?? null,
    position: (POSITIONS as readonly unknown[]).includes(raw.position) ? raw.position as WidgetPosition : "bottom-right",
    welcomeMessage: typeof raw.welcomeMessage === "string" || raw.welcomeMessage === null ? raw.welcomeMessage : null,
    placeholder: typeof raw.placeholder === "string" || raw.placeholder === null ? raw.placeholder : null,
    suggestions,
    avatarUrl: typeof raw.avatarUrl === "string" || raw.avatarUrl === null ? raw.avatarUrl : null,
    displayMode: raw.displayMode === "debug" ? "debug" : "support",
    locale: raw.locale === "fr" || raw.locale === "en" ? raw.locale : null,
    headerTitle: typeof raw.headerTitle === "string" || raw.headerTitle === null ? raw.headerTitle : null,
    hidePoweredBy: raw.hidePoweredBy === true,
    customCss: typeof raw.customCss === "string" || raw.customCss === null ? raw.customCss : null,
    rateLimitPerMinute: typeof raw.rateLimitPerMinute === "number" ? raw.rateLimitPerMinute : 10,
    sessionTtlMinutes: typeof raw.sessionTtlMinutes === "number" ? raw.sessionTtlMinutes : 30,
    isActive: raw.isActive === true,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : "",
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "",
  };
}

function presentAnalytics(value: unknown): WidgetAnalytics {
  const raw = object(value);
  const number = (key: string) => typeof raw[key] === "number" ? raw[key] as number : 0;
  return {
    totalSessions: number("totalSessions"), totalMessages: number("totalMessages"),
    averageMessagesPerSession: number("averageMessagesPerSession"), uniqueVisitors: number("uniqueVisitors"),
    topQueries: Array.isArray(raw.topQueries) ? raw.topQueries.flatMap((item) => {
      const entry = object(item); return typeof entry.message === "string" && typeof entry.count === "number" ? [{ message: entry.message, count: entry.count }] : [];
    }) : [],
    dailyBreakdown: Array.isArray(raw.dailyBreakdown) ? raw.dailyBreakdown.flatMap((item) => {
      const entry = object(item); return typeof entry.date === "string" && typeof entry.sessions === "number" && typeof entry.messages === "number"
        ? [{ date: entry.date, sessions: entry.sessions, messages: entry.messages }] : [];
    }) : [],
    conversationFeedbacks: number("conversationFeedbacks"), resolvedCount: number("resolvedCount"),
    resolutionRate: number("resolutionRate"), averageRating: typeof raw.averageRating === "number" ? raw.averageRating : null,
  };
}

export const managedWidgetContracts = {
  serializeCreate: (value: ManagedWidgetCreateParams | Record<string, unknown>) => serializeWidget(value, true),
  serializeUpdate: (value: ManagedWidgetUpdateParams | Record<string, unknown>) => serializeWidget(value, false),
  present: presentWidget,
  presentAnalytics,
};
