import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/** Keeps the vehicle's odometer in sync with the latest logged service —
 * never decreases it automatically, only bumps it forward. Shared by the
 * create and update maintenance-log routes. */
export async function syncVehicleMileage(
  supabase: SupabaseClient<Database>,
  vehicleId: string,
  loggedMileage: number,
) {
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("current_mileage")
    .eq("id", vehicleId)
    .single();

  if (vehicle && loggedMileage > vehicle.current_mileage) {
    await supabase.from("vehicles").update({ current_mileage: loggedMileage }).eq("id", vehicleId);
  }
}
