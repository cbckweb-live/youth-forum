"use client";

import GenericCrudSection from "@/lib/crud/GenericCrudSection";
import { livingRoomSchema } from "@/lib/crud/schemas";

export default function LivingRoomSection() {
  return <GenericCrudSection schema={livingRoomSchema} />;
}
