type Property = {
  type: "string" | "boolean";
  minLength?: number;
  maxLength?: number;
  default?: any;
};

interface Properties {
  [key: string]: Property;
}

interface ItemsI {
  type: "object";
  additionalProperties: boolean;
  properties: Properties;
}

export interface SchemaI {
  type: "array" | "object";
  additionalProperties: boolean;
  properties: Properties;
  required?: string[];
  items?: Array<ItemsI>;
}
