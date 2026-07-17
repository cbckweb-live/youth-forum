"use client";

import GenericCrudSection from "@/lib/crud/GenericCrudSection";
import { eventsSchema } from "@/lib/crud/schemas";

export default function EventsSection() {
  return <GenericCrudSection schema={eventsSchema} />;
}
