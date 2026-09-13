import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const VEHICLE_IMAGES_BUCKET = "vehicle-images";

/**
 * Uploads a vehicle photo to `${userId}/${vehicleId}-${timestamp}.${ext}` so
 * the storage RLS policies (scoped to the first path segment == auth.uid())
 * apply, and returns its public URL.
 */
export async function uploadVehicleImage(
  supabase: SupabaseClient<Database>,
  userId: string,
  vehicleId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${vehicleId}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(VEHICLE_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(VEHICLE_IMAGES_BUCKET).getPublicUrl(path);

  return publicUrl;
}

/** Best-effort delete — failures are logged, not thrown, since a missing
 * storage object should never block a DB write the user is waiting on. */
export async function deleteVehicleImageByUrl(
  supabase: SupabaseClient<Database>,
  imageUrl: string,
): Promise<void> {
  const marker = `/${VEHICLE_IMAGES_BUCKET}/`;
  const index = imageUrl.indexOf(marker);
  if (index === -1) return;

  const path = imageUrl.slice(index + marker.length);
  const { error } = await supabase.storage.from(VEHICLE_IMAGES_BUCKET).remove([path]);
  if (error) console.error("Failed to delete vehicle image:", path, error.message);
}
