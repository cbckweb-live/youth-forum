"use client";

import GenericCrudSection from "@/lib/crud/GenericCrudSection";
import { mathetesSchema } from "@/lib/crud/schemas";

export default function MathetesSection() {
  return <GenericCrudSection schema={mathetesSchema} />;
}
