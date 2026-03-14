"use client";

import { MessagingView } from "@/components/shared/MessagingView";

interface Props {
  readonly actorId: string;
}

export function CorporateMessages({ actorId }: Props) {
  return (
    <MessagingView
      currentActorType="CORPORATE_MANAGER"
      currentActorId={actorId}
    />
  );
}
