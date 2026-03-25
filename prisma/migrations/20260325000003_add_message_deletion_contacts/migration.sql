-- CreateTable: message_deletions
CREATE TABLE "message_deletions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "message_deletions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: message_contacts
CREATE TABLE "message_contacts" (
    "id" TEXT NOT NULL,
    "ownerType" "ActorType" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "contactType" "ActorType" NOT NULL,
    "contactId" TEXT NOT NULL,
    "contactName" TEXT,
    "tenantId" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "message_contacts_pkey" PRIMARY KEY ("id")
);

-- Unique indexes
CREATE UNIQUE INDEX "message_deletions_messageId_actorType_actorId_key" ON "message_deletions"("messageId", "actorType", "actorId");
CREATE UNIQUE INDEX "message_contacts_ownerType_ownerId_contactType_contactId_key" ON "message_contacts"("ownerType", "ownerId", "contactType", "contactId");

-- Regular indexes
CREATE INDEX "message_deletions_messageId_idx" ON "message_deletions"("messageId");
CREATE INDEX "message_deletions_actorType_actorId_idx" ON "message_deletions"("actorType", "actorId");
CREATE INDEX "message_contacts_ownerType_ownerId_idx" ON "message_contacts"("ownerType", "ownerId");
CREATE INDEX "message_contacts_tenantId_idx" ON "message_contacts"("tenantId");

-- Foreign keys
ALTER TABLE "message_deletions" ADD CONSTRAINT "message_deletions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "direct_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
