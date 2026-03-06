-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmergencyContact_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "owner_type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PanicEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "accuracy_m" REAL NOT NULL,
    "captured_at" DATETIME NOT NULL,
    "audio_url" TEXT,
    "audio_duration_s" INTEGER NOT NULL DEFAULT 30,
    CONSTRAINT "PanicEvent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PanicNotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "panic_event_id" TEXT NOT NULL,
    "target_token" TEXT NOT NULL,
    "success" INTEGER NOT NULL,
    "error" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PanicNotificationLog_panic_event_id_fkey" FOREIGN KEY ("panic_event_id") REFERENCES "PanicEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "EmergencyContact_user_id_idx" ON "EmergencyContact"("user_id");

-- CreateIndex
CREATE INDEX "PanicEvent_user_id_idx" ON "PanicEvent"("user_id");

-- CreateIndex
CREATE INDEX "PanicNotificationLog_panic_event_id_idx" ON "PanicNotificationLog"("panic_event_id");
