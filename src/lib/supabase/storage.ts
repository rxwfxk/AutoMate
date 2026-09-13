import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const VEHICLE_IMAGES_BUCKET = "vehicle-images";
const MAINTENANCE_RECEIPTS_BUCKET = "maintenance-receipts";
const PROFILE_AVATARS_BUCKET = "profile-avatars";

/** Uploads to `${userId}/${entityId}-${timestamp}.${ext}` so the storage RLS
 * policies (scoped to the first path segment == auth.uid()) apply, and
 * returns the public URL. */
async function uploadToBucket(
  supabase: SupabaseClient<Database>,
  bucket: string,
  userId: string,
  entityId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${entityId}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

/** Best-effort delete — failures are logged, not thrown, since a missing
 * storage object should never block a DB write the user is waiting on. */
async function deleteFromBucketByUrl(
  supabase: SupabaseClient<Database>,
  bucket: string,
  fileUrl: string,
): Promise<void> {
  const marker = `/${bucket}/`;
  const index = fileUrl.indexOf(marker);
  if (index === -1) return;

  const path = fileUrl.slice(index + marker.length);
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) console.error(`Failed to delete file from ${bucket}:`, path, error.message);
}

export function uploadVehicleImage(
  supabase: SupabaseClient<Database>,
  userId: string,
  vehicleId: string,
  file: File,
) {
  return uploadToBucket(supabase, VEHICLE_IMAGES_BUCKET, userId, vehicleId, file);
}

export function deleteVehicleImageByUrl(supabase: SupabaseClient<Database>, imageUrl: string) {
  return deleteFromBucketByUrl(supabase, VEHICLE_IMAGES_BUCKET, imageUrl);
}

export function uploadReceiptImage(
  supabase: SupabaseClient<Database>,
  userId: string,
  maintenanceLogId: string,
  file: File,
) {
  return uploadToBucket(supabase, MAINTENANCE_RECEIPTS_BUCKET, userId, maintenanceLogId, file);
}

export function deleteReceiptImageByUrl(supabase: SupabaseClient<Database>, fileUrl: string) {
  return deleteFromBucketByUrl(supabase, MAINTENANCE_RECEIPTS_BUCKET, fileUrl);
}

export function uploadAvatarImage(
  supabase: SupabaseClient<Database>,
  userId: string,
  file: File,
) {
  return uploadToBucket(supabase, PROFILE_AVATARS_BUCKET, userId, "avatar", file);
}

export function deleteAvatarImageByUrl(supabase: SupabaseClient<Database>, fileUrl: string) {
  return deleteFromBucketByUrl(supabase, PROFILE_AVATARS_BUCKET, fileUrl);
}
