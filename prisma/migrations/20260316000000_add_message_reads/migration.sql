-- CreateTable
CREATE TABLE "message_reads" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_reads_messageId_actorType_actorId_key" ON "message_reads"("messageId", "actorType", "actorId");

-- CreateIndex
CREATE INDEX "message_reads_messageId_idx" ON "message_reads"("messageId");

-- CreateIndex
CREATE INDEX "message_reads_actorType_actorId_idx" ON "message_reads"("actorType", "actorId");

-- AddForeignKey
ALTER TABLE "message_reads" ADD CONSTRAINT "message_reads_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "direct_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
