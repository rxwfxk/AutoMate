// Hand-written to match supabase/migrations/0001_init_schema.sql.
//
// Once the Supabase project is linked, regenerate the authoritative version
// with:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.types.ts
// The shape below follows the same convention the CLI generates, so callers
// (e.g. `createClient<Database>()`) do not need to change either way.

export type DocumentType =
  | "compulsory_insurance"
  | "voluntary_insurance"
  | "tax"
  | "driving_license";

export type NotifyVia = "email";

export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          brand: string;
          model: string;
          year: number | null;
          license_plate: string | null;
          current_mileage: number;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          brand: string;
          model: string;
          year?: number | null;
          license_plate?: string | null;
          current_mileage?: number;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vehicles"]["Insert"]>;
      };
      maintenance_types: {
        Row: {
          id: string;
          name: string;
          default_interval_km: number | null;
          default_interval_months: number | null;
          icon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          default_interval_km?: number | null;
          default_interval_months?: number | null;
          icon?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["maintenance_types"]["Insert"]>;
      };
      maintenance_logs: {
        Row: {
          id: string;
          vehicle_id: string;
          maintenance_type_id: string;
          service_date: string;
          mileage_at_service: number;
          cost: number | null;
          shop_name: string | null;
          receipt_image_url: string | null;
          notes: string | null;
          /** Computed by the `set_maintenance_next_due` DB trigger — do not set from the client. */
          next_due_mileage: number | null;
          /** Computed by the `set_maintenance_next_due` DB trigger — do not set from the client. */
          next_due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          maintenance_type_id: string;
          service_date: string;
          mileage_at_service: number;
          cost?: number | null;
          shop_name?: string | null;
          receipt_image_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["maintenance_logs"]["Insert"]>;
      };
      documents: {
        Row: {
          id: string;
          vehicle_id: string;
          document_type: DocumentType;
          issue_date: string | null;
          expiry_date: string;
          policy_number: string | null;
          cost: number | null;
          file_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          document_type: DocumentType;
          issue_date?: string | null;
          expiry_date: string;
          policy_number?: string | null;
          cost?: number | null;
          file_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
      notification_settings: {
        Row: {
          id: string;
          user_id: string;
          days_before_alert: number[];
          notify_via: NotifyVia;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          days_before_alert?: number[];
          notify_via?: NotifyVia;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notification_settings"]["Insert"]>;
      };
    };
  };
}

export type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
export type MaintenanceType = Database["public"]["Tables"]["maintenance_types"]["Row"];
export type MaintenanceLog = Database["public"]["Tables"]["maintenance_logs"]["Row"];
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type NotificationSettings = Database["public"]["Tables"]["notification_settings"]["Row"];
