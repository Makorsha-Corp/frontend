export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      access_control: {
        Row: {
          id: number
          role: Database["public"]["Enums"]["access_roles"]
          target: string
          type: Database["public"]["Enums"]["access_types"]
        }
        Insert: {
          id?: number
          role: Database["public"]["Enums"]["access_roles"]
          target: string
          type: Database["public"]["Enums"]["access_types"]
        }
        Update: {
          id?: number
          role?: Database["public"]["Enums"]["access_roles"]
          target?: string
          type?: Database["public"]["Enums"]["access_types"]
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          enabled: boolean
          id: number
          name: string
        }
        Insert: {
          enabled: boolean
          id?: number
          name: string
        }
        Update: {
          enabled?: boolean
          id?: number
          name?: string
        }
        Relationships: []
      }
      damaged_parts: {
        Row: {
          avg_price: number | null
          factory_id: number
          id: number
          part_id: number
          qty: number
        }
        Insert: {
          avg_price?: number | null
          factory_id: number
          id?: number
          part_id: number
          qty: number
        }
        Update: {
          avg_price?: number | null
          factory_id?: number
          id?: number
          part_id?: number
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "damaged_parts_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damaged_parts_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "fullname_machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damaged_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      factories: {
        Row: {
          abbreviation: string
          id: number
          name: string
        }
        Insert: {
          abbreviation: string
          id?: number
          name: string
        }
        Update: {
          abbreviation?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      factory_sections: {
        Row: {
          factory_id: number
          id: number
          name: string
        }
        Insert: {
          factory_id: number
          id?: number
          name: string
        }
        Update: {
          factory_id?: number
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "factory_sections_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factory_sections_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "fullname_machines"
            referencedColumns: ["id"]
          },
        ]
      }
      instant_add_damaged_part: {
        Row: {
          added_at: string
          added_by: number | null
          factory_id: number | null
          id: number
          note: string | null
          part_id: number | null
          qty: number
        }
        Insert: {
          added_at?: string
          added_by?: number | null
          factory_id?: number | null
          id?: number
          note?: string | null
          part_id?: number | null
          qty: number
        }
        Update: {
          added_at?: string
          added_by?: number | null
          factory_id?: number | null
          id?: number
          note?: string | null
          part_id?: number | null
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "instant_add_damaged_part_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instant_add_damaged_part_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instant_add_damaged_part_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "fullname_machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instant_add_damaged_part_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      instant_add_machine_part: {
        Row: {
          added_at: string
          added_by: number
          avg_price: number | null
          factory_id: number
          id: number
          note: string | null
          part_id: number
          qty: number | null
        }
        Insert: {
          added_at?: string
          added_by: number
          avg_price?: number | null
          factory_id: number
          id?: number
          note?: string | null
          part_id: number
          qty?: number | null
        }
        Update: {
          added_at?: string
          added_by?: number
          avg_price?: number | null
          factory_id?: number
          id?: number
          note?: string | null
          part_id?: number
          qty?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "instant_add_machine_part_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instant_add_machine_part_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instant_add_machine_part_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "fullname_machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instant_add_machine_part_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      instant_add_storage_part: {
        Row: {
          added_at: string
          added_by: number
          avg_price: number
          factory_id: number
          id: number
          note: string | null
          part_id: number
          qty: number
        }
        Insert: {
          added_at?: string
          added_by: number
          avg_price: number
          factory_id: number
          id?: number
          note?: string | null
          part_id: number
          qty: number
        }
        Update: {
          added_at?: string
          added_by?: number
          avg_price?: number
          factory_id?: number
          id?: number
          note?: string | null
          part_id?: number
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "storage_instant_add_part_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_instant_add_part_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_instant_add_part_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "fullname_machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_instant_add_part_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_parts: {
        Row: {
          defective_qty: number | null
          id: number
          machine_id: number
          part_id: number
          qty: number
          req_qty: number | null
        }
        Insert: {
          defective_qty?: number | null
          id?: number
          machine_id: number
          part_id: number
          qty: number
          req_qty?: number | null
        }
        Update: {
          defective_qty?: number | null
          id?: number
          machine_id?: number
          part_id?: number
          qty?: number
          req_qty?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "machine_parts_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "fullname_machines"
            referencedColumns: ["machineid"]
          },
          {
            foreignKeyName: "machine_parts_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          factory_section_id: number
          id: number
          is_running: boolean
          name: string
        }
        Insert: {
          factory_section_id: number
          id?: number
          is_running: boolean
          name: string
        }
        Update: {
          factory_section_id?: number
          id?: number
          is_running?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "machines_factory_section_id_fkey"
            columns: ["factory_section_id"]
            isOneToOne: false
            referencedRelation: "factory_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machines_factory_section_id_fkey"
            columns: ["factory_section_id"]
            isOneToOne: false
            referencedRelation: "fullname_machines"
            referencedColumns: ["factorysectionid"]
          },
        ]
      }
      miscellaneous_project_costs: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: number
          name: string
          project_component_id: number | null
          project_id: number | null
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: number
          name: string
          project_component_id?: number | null
          project_id?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          project_component_id?: number | null
          project_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "miscellaneous_project_costs_project_component_id_fkey"
            columns: ["project_component_id"]
            isOneToOne: false
            referencedRelation: "project_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "miscellaneous_project_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      order_parts: {
        Row: {
          approved_budget: boolean
          approved_office_order: boolean
          approved_pending_order: boolean
          approved_storage_withdrawal: boolean
          brand: string | null
          deleted_at: string | null
          id: number
          in_storage: boolean
          is_deleted: boolean
          is_sample_received_by_office: boolean
          is_sample_sent_to_office: boolean
          mrr_number: string | null
          note: string | null
          office_note: string | null
          order_id: number
          part_id: number
          part_purchased_date: string | null
          part_received_by_factory_date: string | null
          part_sent_by_office_date: string | null
          qty: number
          qty_taken_from_storage: number
          unit_cost: number | null
          unstable_type:
            | Database["public"]["Enums"]["unstabling_effects"]
            | null
          vendor: string | null
        }
        Insert: {
          approved_budget?: boolean
          approved_office_order?: boolean
          approved_pending_order?: boolean
          approved_storage_withdrawal?: boolean
          brand?: string | null
          deleted_at?: string | null
          id?: number
          in_storage?: boolean
          is_deleted?: boolean
          is_sample_received_by_office?: boolean
          is_sample_sent_to_office?: boolean
          mrr_number?: string | null
          note?: string | null
          office_note?: string | null
          order_id: number
          part_id: number
          part_purchased_date?: string | null
          part_received_by_factory_date?: string | null
          part_sent_by_office_date?: string | null
          qty: number
          qty_taken_from_storage?: number
          unit_cost?: number | null
          unstable_type?:
            | Database["public"]["Enums"]["unstabling_effects"]
            | null
          vendor?: string | null
        }
        Update: {
          approved_budget?: boolean
          approved_office_order?: boolean
          approved_pending_order?: boolean
          approved_storage_withdrawal?: boolean
          brand?: string | null
          deleted_at?: string | null
          id?: number
          in_storage?: boolean
          is_deleted?: boolean
          is_sample_received_by_office?: boolean
          is_sample_sent_to_office?: boolean
          mrr_number?: string | null
          note?: string | null
          office_note?: string | null
          order_id?: number
          part_id?: number
          part_purchased_date?: string | null
          part_received_by_factory_date?: string | null
          part_sent_by_office_date?: string | null
          qty?: number
          qty_taken_from_storage?: number
          unit_cost?: number | null
          unstable_type?:
            | Database["public"]["Enums"]["unstabling_effects"]
            | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_parts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      order_parts_logs: {
        Row: {
          action_on: string
          after: string
          before: string
          id: number
          note: string | null
          order_part_id: number
          updated_by: number
          updated_on: string
        }
        Insert: {
          action_on: string
          after: string
          before: string
          id?: number
          note?: string | null
          order_part_id: number
          updated_by: number
          updated_on: string
        }
        Update: {
          action_on?: string
          after?: string
          before?: string
          id?: number
          note?: string | null
          order_part_id?: number
          updated_by?: number
          updated_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_parts_logs_order_part_id_fkey"
            columns: ["order_part_id"]
            isOneToOne: false
            referencedRelation: "order_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_parts_logs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_workflows: {
        Row: {
          allowed_reverts_json: Json | null
          description: string | null
          id: number
          name: string
          status_sequence: number[]
          type: string
        }
        Insert: {
          allowed_reverts_json?: Json | null
          description?: string | null
          id?: number
          name: string
          status_sequence: number[]
          type: string
        }
        Update: {
          allowed_reverts_json?: Json | null
          description?: string | null
          id?: number
          name?: string
          status_sequence?: number[]
          type?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          created_by_user_id: number
          current_status_id: number
          department_id: number
          factory_id: number
          factory_section_id: number | null
          id: number
          machine_id: number | null
          order_note: string | null
          order_type: string | null
          order_workflow_id: number | null
          project_component_id: number | null
          project_id: number | null
          req_num: string | null
          src_factory: number | null
          src_project_component_id: number | null
        }
        Insert: {
          created_at?: string
          created_by_user_id: number
          current_status_id: number
          department_id: number
          factory_id: number
          factory_section_id?: number | null
          id?: number
          machine_id?: number | null
          order_note?: string | null
          order_type?: string | null
          order_workflow_id?: number | null
          project_component_id?: number | null
          project_id?: number | null
          req_num?: string | null
          src_factory?: number | null
          src_project_component_id?: number | null
        }
        Update: {
          created_at?: string
          created_by_user_id?: number
          current_status_id?: number
          department_id?: number
          factory_id?: number
          factory_section_id?: number | null
          id?: number
          machine_id?: number | null
          order_note?: string | null
          order_type?: string | null
          order_workflow_id?: number | null
          project_component_id?: number | null
          project_id?: number | null
          req_num?: string | null
          src_factory?: number | null
          src_project_component_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_current_status_id_fkey"
            columns: ["current_status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "fullname_machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_factory_section_id_fkey"
            columns: ["factory_section_id"]
            isOneToOne: false
            referencedRelation: "factory_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_factory_section_id_fkey"
            columns: ["factory_section_id"]
            isOneToOne: false
            referencedRelation: "fullname_machines"
            referencedColumns: ["factorysectionid"]
          },
          {
            foreignKeyName: "orders_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "fullname_machines"
            referencedColumns: ["machineid"]
          },
          {
            foreignKeyName: "orders_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_order_type_fkey"
            columns: ["order_type"]
            isOneToOne: false
            referencedRelation: "order_workflows"
            referencedColumns: ["type"]
          },
          {
            foreignKeyName: "orders_project_component_id_fkey"
            columns: ["project_component_id"]
            isOneToOne: false
            referencedRelation: "project_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_src_project_component_id_fkey"
            columns: ["src_project_component_id"]
            isOneToOne: false
            referencedRelation: "project_components"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          created_at: string
          description: string
          id: number
          name: string
          unit: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: number
          name: string
          unit: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: number
          name?: string
          unit?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          email: string
          id: number
          name: string
          permission: Database["public"]["Enums"]["access_roles"]
          position: string
          user_id: string
        }
        Insert: {
          email: string
          id?: number
          name: string
          permission: Database["public"]["Enums"]["access_roles"]
          position: string
          user_id?: string
        }
        Update: {
          email?: string
          id?: number
          name?: string
          permission?: Database["public"]["Enums"]["access_roles"]
          position?: string
          user_id?: string
        }
        Relationships: []
      }
      project_component_parts: {
        Row: {
          id: number
          part_id: number
          project_component_id: number
          qty: number
        }
        Insert: {
          id?: number
          part_id: number
          project_component_id: number
          qty: number
        }
        Update: {
          id?: number
          part_id?: number
          project_component_id?: number
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_component_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_component_parts_project_component_id_fkey"
            columns: ["project_component_id"]
            isOneToOne: false
            referencedRelation: "project_components"
            referencedColumns: ["id"]
          },
        ]
      }
      project_component_tasks: {
        Row: {
          created_at: string
          description: string
          id: number
          is_completed: boolean
          is_note: boolean
          name: string
          project_component_id: number
          task_priority: Database["public"]["Enums"]["project_priotity"] | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: number
          is_completed?: boolean
          is_note: boolean
          name: string
          project_component_id: number
          task_priority?: Database["public"]["Enums"]["project_priotity"] | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: number
          is_completed?: boolean
          is_note?: boolean
          name?: string
          project_component_id?: number
          task_priority?: Database["public"]["Enums"]["project_priotity"] | null
        }
        Relationships: []
      }
      project_components: {
        Row: {
          budget: number | null
          created_at: string
          deadline: string | null
          description: string | null
          end_date: string | null
          id: number
          name: string
          project_id: number
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
        }
        Insert: {
          budget?: number | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          name: string
          project_id: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
        }
        Update: {
          budget?: number | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          name?: string
          project_id?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
        }
        Relationships: [
          {
            foreignKeyName: "project_components_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          created_at: string
          deadline: string | null
          description: string
          end_date: string | null
          factory_id: number
          id: number
          name: string
          priority: Database["public"]["Enums"]["project_priotity"]
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
        }
        Insert: {
          budget?: number | null
          created_at?: string
          deadline?: string | null
          description: string
          end_date?: string | null
          factory_id: number
          id?: number
          name: string
          priority?: Database["public"]["Enums"]["project_priotity"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
        }
        Update: {
          budget?: number | null
          created_at?: string
          deadline?: string | null
          description?: string
          end_date?: string | null
          factory_id?: number
          id?: number
          name?: string
          priority?: Database["public"]["Enums"]["project_priotity"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
        }
        Relationships: [
          {
            foreignKeyName: "projects_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "fullname_machines"
            referencedColumns: ["id"]
          },
        ]
      }
      status_tracker: {
        Row: {
          action_at: string
          action_by_user_id: number
          id: number
          order_id: number
          status_id: number
        }
        Insert: {
          action_at?: string
          action_by_user_id: number
          id?: number
          order_id: number
          status_id: number
        }
        Update: {
          action_at?: string
          action_by_user_id?: number
          id?: number
          order_id?: number
          status_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "status_tracker_action_by_user_id_fkey"
            columns: ["action_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_tracker_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_tracker_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      statuses: {
        Row: {
          comment: string
          id: number
          name: string
        }
        Insert: {
          comment: string
          id?: number
          name: string
        }
        Update: {
          comment?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      storage_parts: {
        Row: {
          avg_price: number | null
          factory_id: number
          id: number
          part_id: number
          qty: number
        }
        Insert: {
          avg_price?: number | null
          factory_id: number
          id?: number
          part_id: number
          qty: number
        }
        Update: {
          avg_price?: number | null
          factory_id?: number
          id?: number
          part_id?: number
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "storage_parts_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_parts_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "fullname_machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      fullname_machines: {
        Row: {
          abrev: string | null
          factorysectionid: number | null
          fullnamemachine: string | null
          id: number | null
          isrunning: boolean | null
          machineid: number | null
          name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      access_roles: "owner" | "finance" | "ground-team" | "ground-team-manager"
      access_types: "page" | "manage_order" | "feature"
      project_priotity: "LOW" | "MEDIUM" | "HIGH"
      project_status: "PLANNING" | "STARTED" | "COMPLETED"
      unstabling_effects: "INACTIVE" | "DEFECTIVE" | "LESS"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      access_roles: ["owner", "finance", "ground-team", "ground-team-manager"],
      access_types: ["page", "manage_order", "feature"],
      project_priotity: ["LOW", "MEDIUM", "HIGH"],
      project_status: ["PLANNING", "STARTED", "COMPLETED"],
      unstabling_effects: ["INACTIVE", "DEFECTIVE", "LESS"],
    },
  },
} as const
