export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_alerts: {
        Row: {
          created_at: string | null
          created_for: string | null
          data: Json | null
          entity_id: string | null
          entity_type: string
          expires_at: string | null
          id: string
          message: string
          priority: string | null
          status: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          created_for?: string | null
          data?: Json | null
          entity_id?: string | null
          entity_type: string
          expires_at?: string | null
          id?: string
          message: string
          priority?: string | null
          status?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          created_for?: string | null
          data?: Json | null
          entity_id?: string | null
          entity_type?: string
          expires_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          status?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      ai_tasks_log: {
        Row: {
          completed_at: string | null
          contract_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          processing_time_ms: number | null
          status: string | null
          task_type: string
        }
        Insert: {
          completed_at?: string | null
          contract_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          processing_time_ms?: number | null
          status?: string | null
          task_type: string
        }
        Update: {
          completed_at?: string | null
          contract_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          processing_time_ms?: number | null
          status?: string | null
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tasks_log_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          category: string
          created_at: string | null
          data_type: string
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          data_type?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          category?: string
          created_at?: string | null
          data_type?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string | null
          annual_budget: number | null
          city: string
          code: string
          company_id: string | null
          country: string
          created_at: string | null
          created_by: string | null
          currency_code: string | null
          description: string | null
          director_id: string | null
          email: string | null
          employee_capacity: number | null
          hr_manager_id: string | null
          id: string
          is_headquarters: boolean | null
          language_code: string | null
          level: number | null
          name: string
          opening_date: string | null
          parent_branch_id: string | null
          phone: string | null
          postal_code: string | null
          region: string | null
          status: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          annual_budget?: number | null
          city: string
          code: string
          company_id?: string | null
          country?: string
          created_at?: string | null
          created_by?: string | null
          currency_code?: string | null
          description?: string | null
          director_id?: string | null
          email?: string | null
          employee_capacity?: number | null
          hr_manager_id?: string | null
          id?: string
          is_headquarters?: boolean | null
          language_code?: string | null
          level?: number | null
          name: string
          opening_date?: string | null
          parent_branch_id?: string | null
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          annual_budget?: number | null
          city?: string
          code?: string
          company_id?: string | null
          country?: string
          created_at?: string | null
          created_by?: string | null
          currency_code?: string | null
          description?: string | null
          director_id?: string | null
          email?: string | null
          employee_capacity?: number | null
          hr_manager_id?: string | null
          id?: string
          is_headquarters?: boolean | null
          language_code?: string | null
          level?: number | null
          name?: string
          opening_date?: string | null
          parent_branch_id?: string | null
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_director_id_fkey"
            columns: ["director_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_hr_manager_id_fkey"
            columns: ["hr_manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_parent_branch_id_fkey"
            columns: ["parent_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_branches_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      client_activity_logs: {
        Row: {
          activity_type: string
          details: Json | null
          id: string
          timestamp: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          details?: Json | null
          id?: string
          timestamp?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          details?: Json | null
          id?: string
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      client_behavior_analysis: {
        Row: {
          analysis_data: Json
          company_id: string
          created_at: string | null
          id: string
          model_version: string
          predicted_ltv: number | null
          risk_score: number | null
          updated_at: string | null
        }
        Insert: {
          analysis_data: Json
          company_id: string
          created_at?: string | null
          id?: string
          model_version?: string
          predicted_ltv?: number | null
          risk_score?: number | null
          updated_at?: string | null
        }
        Update: {
          analysis_data?: Json
          company_id?: string
          created_at?: string | null
          id?: string
          model_version?: string
          predicted_ltv?: number | null
          risk_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_behavior_analysis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      contract_alerts: {
        Row: {
          action_taken: string | null
          alert_type: string
          auto_generated: boolean | null
          contract_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          status: string | null
          title: string
          trigger_date: string
          updated_at: string | null
        }
        Insert: {
          action_taken?: string | null
          alert_type: string
          auto_generated?: boolean | null
          contract_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          title: string
          trigger_date: string
          updated_at?: string | null
        }
        Update: {
          action_taken?: string | null
          alert_type?: string
          auto_generated?: boolean | null
          contract_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          title?: string
          trigger_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_alerts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_obligations: {
        Row: {
          assigned_to: string | null
          auto_notify: boolean | null
          completed_at: string | null
          completion_percentage: number | null
          contract_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string
          frequency: string | null
          id: string
          last_notification_sent: string | null
          next_occurrence: string | null
          notification_days_before: number | null
          obligation_type: string
          responsible_party: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          auto_notify?: boolean | null
          completed_at?: string | null
          completion_percentage?: number | null
          contract_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date: string
          frequency?: string | null
          id?: string
          last_notification_sent?: string | null
          next_occurrence?: string | null
          notification_days_before?: number | null
          obligation_type: string
          responsible_party: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          auto_notify?: boolean | null
          completed_at?: string | null
          completion_percentage?: number | null
          contract_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string
          frequency?: string | null
          id?: string
          last_notification_sent?: string | null
          next_occurrence?: string | null
          notification_days_before?: number | null
          obligation_type?: string
          responsible_party?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_obligations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          ai_optimized: boolean | null
          compliance_level: string | null
          contract_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          industry_specific: boolean | null
          is_active: boolean | null
          name: string
          success_rate: number | null
          template_content: string
          updated_at: string | null
          usage_count: number | null
          variables_schema: Json | null
          version: string | null
        }
        Insert: {
          ai_optimized?: boolean | null
          compliance_level?: string | null
          contract_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          industry_specific?: boolean | null
          is_active?: boolean | null
          name: string
          success_rate?: number | null
          template_content: string
          updated_at?: string | null
          usage_count?: number | null
          variables_schema?: Json | null
          version?: string | null
        }
        Update: {
          ai_optimized?: boolean | null
          compliance_level?: string | null
          contract_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          industry_specific?: boolean | null
          is_active?: boolean | null
          name?: string
          success_rate?: number | null
          template_content?: string
          updated_at?: string | null
          usage_count?: number | null
          variables_schema?: Json | null
          version?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          ai_confidence_score: number | null
          amount: number
          auto_renewal: boolean | null
          clauses_summary: Json | null
          client_id: string
          compliance_score: number | null
          content_preview: string | null
          content_storage_url: string | null
          contract_number: string
          contract_type: string | null
          created_at: string | null
          created_by: string | null
          currency: string
          devis_id: string | null
          end_date: string
          generated_by_ai: boolean | null
          id: string
          last_modified_by: string | null
          next_review_date: string | null
          object: string
          obligations_monitoring: Json | null
          payment_terms: string | null
          renewal_date: string | null
          risk_analysis: Json | null
          signature_date: string | null
          start_date: string
          status: string | null
          template_used: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_confidence_score?: number | null
          amount: number
          auto_renewal?: boolean | null
          clauses_summary?: Json | null
          client_id: string
          compliance_score?: number | null
          content_preview?: string | null
          content_storage_url?: string | null
          contract_number: string
          contract_type?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          devis_id?: string | null
          end_date: string
          generated_by_ai?: boolean | null
          id?: string
          last_modified_by?: string | null
          next_review_date?: string | null
          object: string
          obligations_monitoring?: Json | null
          payment_terms?: string | null
          renewal_date?: string | null
          risk_analysis?: Json | null
          signature_date?: string | null
          start_date: string
          status?: string | null
          template_used?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_confidence_score?: number | null
          amount?: number
          auto_renewal?: boolean | null
          clauses_summary?: Json | null
          client_id?: string
          compliance_score?: number | null
          content_preview?: string | null
          content_storage_url?: string | null
          contract_number?: string
          contract_type?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string
          devis_id?: string | null
          end_date?: string
          generated_by_ai?: boolean | null
          id?: string
          last_modified_by?: string | null
          next_review_date?: string | null
          object?: string
          obligations_monitoring?: Json | null
          payment_terms?: string | null
          renewal_date?: string | null
          risk_analysis?: Json | null
          signature_date?: string | null
          start_date?: string
          status?: string | null
          template_used?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_devis_id_fkey"
            columns: ["devis_id"]
            isOneToOne: false
            referencedRelation: "devis"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          annual_budget: number | null
          branch_id: string
          code: string
          cost_center_code: string | null
          created_at: string | null
          description: string | null
          id: string
          level: number | null
          manager_id: string | null
          max_employees: number | null
          name: string
          overtime_allowed: boolean | null
          parent_department_id: string | null
          remote_work_allowed: boolean | null
          status: string
          updated_at: string | null
        }
        Insert: {
          annual_budget?: number | null
          branch_id: string
          code: string
          cost_center_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          level?: number | null
          manager_id?: string | null
          max_employees?: number | null
          name: string
          overtime_allowed?: boolean | null
          parent_department_id?: string | null
          remote_work_allowed?: boolean | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          annual_budget?: number | null
          branch_id?: string
          code?: string
          cost_center_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          level?: number | null
          manager_id?: string | null
          max_employees?: number | null
          name?: string
          overtime_allowed?: boolean | null
          parent_department_id?: string | null
          remote_work_allowed?: boolean | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      devis: {
        Row: {
          amount: number
          company_id: string
          created_at: string | null
          id: string
          notes: string | null
          number: string
          object: string
          original_amount: number | null
          rejection_reason: string | null
          status: string
          valid_until: string
          validated_at: string | null
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          number: string
          object: string
          original_amount?: number | null
          rejection_reason?: string | null
          status: string
          valid_until: string
          validated_at?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          number?: string
          object?: string
          original_amount?: number | null
          rejection_reason?: string | null
          status?: string
          valid_until?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      devis_items: {
        Row: {
          description: string
          devis_id: string
          id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          description: string
          devis_id: string
          id?: string
          quantity: number
          total: number
          unit_price: number
        }
        Update: {
          description?: string
          devis_id?: string
          id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "devis_items_devis_id_fkey"
            columns: ["devis_id"]
            isOneToOne: false
            referencedRelation: "devis"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: Json | null
          badge_number: string | null
          branch_id: string
          created_at: string | null
          created_by: string | null
          current_salary: number | null
          date_of_birth: string | null
          department_id: string
          emergency_contact: Json | null
          employee_number: string
          employment_status: string
          employment_type: string
          end_date: string | null
          first_name: string
          gender: string | null
          hire_date: string
          id: string
          last_name: string
          manager_id: string | null
          middle_name: string | null
          nationality: string | null
          performance_score: number | null
          personal_email: string | null
          personal_phone: string | null
          position_id: string
          preferred_name: string | null
          probation_end_date: string | null
          salary_currency: string | null
          skills: Json | null
          start_date: string
          timezone: string | null
          updated_at: string | null
          user_id: string | null
          vacation_days_total: number | null
          vacation_days_used: number | null
          work_email: string | null
          work_phone: string | null
          work_preferences: Json | null
        }
        Insert: {
          address?: Json | null
          badge_number?: string | null
          branch_id: string
          created_at?: string | null
          created_by?: string | null
          current_salary?: number | null
          date_of_birth?: string | null
          department_id: string
          emergency_contact?: Json | null
          employee_number: string
          employment_status?: string
          employment_type?: string
          end_date?: string | null
          first_name: string
          gender?: string | null
          hire_date: string
          id?: string
          last_name: string
          manager_id?: string | null
          middle_name?: string | null
          nationality?: string | null
          performance_score?: number | null
          personal_email?: string | null
          personal_phone?: string | null
          position_id: string
          preferred_name?: string | null
          probation_end_date?: string | null
          salary_currency?: string | null
          skills?: Json | null
          start_date: string
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
          vacation_days_total?: number | null
          vacation_days_used?: number | null
          work_email?: string | null
          work_phone?: string | null
          work_preferences?: Json | null
        }
        Update: {
          address?: Json | null
          badge_number?: string | null
          branch_id?: string
          created_at?: string | null
          created_by?: string | null
          current_salary?: number | null
          date_of_birth?: string | null
          department_id?: string
          emergency_contact?: Json | null
          employee_number?: string
          employment_status?: string
          employment_type?: string
          end_date?: string | null
          first_name?: string
          gender?: string | null
          hire_date?: string
          id?: string
          last_name?: string
          manager_id?: string | null
          middle_name?: string | null
          nationality?: string | null
          performance_score?: number | null
          personal_email?: string | null
          personal_phone?: string | null
          position_id?: string
          preferred_name?: string | null
          probation_end_date?: string | null
          salary_currency?: string | null
          skills?: Json | null
          start_date?: string
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
          vacation_days_total?: number | null
          vacation_days_used?: number | null
          work_email?: string | null
          work_phone?: string | null
          work_preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          description: string
          id: string
          invoice_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          invoice_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Update: {
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          company_id: string
          created_at: string | null
          currency: string
          dexchange_transaction_id: string | null
          due_date: string
          id: string
          notes: string | null
          number: string
          object: string | null
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          sage_account_code: string | null
          sage_anomalies: Json | null
          sage_export_at: string | null
          sage_export_details: Json | null
          sage_export_status: string | null
          sage_processed_by: string | null
          sage_transaction_id: string | null
          sage_validation_needed: boolean | null
          status: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string | null
          currency?: string
          dexchange_transaction_id?: string | null
          due_date: string
          id?: string
          notes?: string | null
          number: string
          object?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          sage_account_code?: string | null
          sage_anomalies?: Json | null
          sage_export_at?: string | null
          sage_export_details?: Json | null
          sage_export_status?: string | null
          sage_processed_by?: string | null
          sage_transaction_id?: string | null
          sage_validation_needed?: boolean | null
          status: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string | null
          currency?: string
          dexchange_transaction_id?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          number?: string
          object?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          sage_account_code?: string | null
          sage_anomalies?: Json | null
          sage_export_at?: string | null
          sage_export_details?: Json | null
          sage_export_status?: string | null
          sage_processed_by?: string | null
          sage_transaction_id?: string | null
          sage_validation_needed?: boolean | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_predictions: {
        Row: {
          created_at: string | null
          id: string
          invoice_id: string
          model_version: string
          prediction_data: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoice_id: string
          model_version?: string
          prediction_data: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invoice_id?: string
          model_version?: string
          prediction_data?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_predictions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          external_transaction_id: string | null
          id: string
          invoice_id: string
          payment_method: string
          payment_url: string | null
          phone_number: string | null
          status: string
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          external_transaction_id?: string | null
          id?: string
          invoice_id: string
          payment_method: string
          payment_url?: string | null
          phone_number?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          external_transaction_id?: string | null
          id?: string
          invoice_id?: string
          payment_method?: string
          payment_url?: string | null
          phone_number?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          branch_id: string
          code: string
          created_at: string | null
          current_headcount: number | null
          department_id: string
          description: string | null
          employment_type: string | null
          id: string
          level: number
          max_headcount: number | null
          remote_work_allowed: boolean | null
          reports_to_position_id: string | null
          required_education: string | null
          required_experience_years: number | null
          required_skills: Json | null
          salary_currency: string | null
          salary_frequency: string | null
          salary_max: number | null
          salary_min: number | null
          seniority_min_years: number | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          branch_id: string
          code: string
          created_at?: string | null
          current_headcount?: number | null
          department_id: string
          description?: string | null
          employment_type?: string | null
          id?: string
          level?: number
          max_headcount?: number | null
          remote_work_allowed?: boolean | null
          reports_to_position_id?: string | null
          required_education?: string | null
          required_experience_years?: number | null
          required_skills?: Json | null
          salary_currency?: string | null
          salary_frequency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seniority_min_years?: number | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string
          code?: string
          created_at?: string | null
          current_headcount?: number | null
          department_id?: string
          description?: string | null
          employment_type?: string | null
          id?: string
          level?: number
          max_headcount?: number | null
          remote_work_allowed?: boolean | null
          reports_to_position_id?: string | null
          required_education?: string | null
          required_experience_years?: number | null
          required_skills?: Json | null
          salary_currency?: string | null
          salary_frequency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seniority_min_years?: number | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "positions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_reports_to_position_id_fkey"
            columns: ["reports_to_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          client_company_id: string | null
          created_at: string | null
          custom_fields: Json | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          owner_id: string | null
          start_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          client_company_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          owner_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          client_company_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_company_id_fkey"
            columns: ["client_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_optimizations: {
        Row: {
          applied: boolean | null
          created_at: string | null
          id: string
          model_version: string
          optimization_data: Json
          quote_id: string
          updated_at: string | null
        }
        Insert: {
          applied?: boolean | null
          created_at?: string | null
          id?: string
          model_version?: string
          optimization_data: Json
          quote_id: string
          updated_at?: string | null
        }
        Update: {
          applied?: boolean | null
          created_at?: string | null
          id?: string
          model_version?: string
          optimization_data?: Json
          quote_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_optimizations_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "devis"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignment_suggestions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          is_applied: boolean | null
          suggested_assignee: string
          suggestion_reasons: Json | null
          task_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          is_applied?: boolean | null
          suggested_assignee: string
          suggestion_reasons?: Json | null
          task_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          is_applied?: boolean | null
          suggested_assignee?: string
          suggestion_reasons?: Json | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignment_suggestions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignments_history: {
        Row: {
          assigned_by: string
          assigned_to: string | null
          assignment_reason: string | null
          created_at: string | null
          id: string
          previous_assignee: string | null
          task_id: string
        }
        Insert: {
          assigned_by: string
          assigned_to?: string | null
          assignment_reason?: string | null
          created_at?: string | null
          id?: string
          previous_assignee?: string | null
          task_id: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string | null
          assignment_reason?: string | null
          created_at?: string | null
          id?: string
          previous_assignee?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comment_reactions: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          reaction_type: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "task_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          edit_history: Json | null
          id: string
          is_edited: boolean | null
          mentions: Json | null
          parent_comment_id: string | null
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          edit_history?: Json | null
          id?: string
          is_edited?: boolean | null
          mentions?: Json | null
          parent_comment_id?: string | null
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          edit_history?: Json | null
          id?: string
          is_edited?: boolean | null
          mentions?: Json | null
          parent_comment_id?: string | null
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "task_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assignee_id: string | null
          blocked_by: string[] | null
          blocking: string[] | null
          complexity_score: number | null
          created_at: string | null
          custom_fields: Json | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          labels: Json | null
          last_activity_at: string | null
          milestone_id: string | null
          position: number | null
          priority: string
          project_id: string
          status: string
          time_tracking: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assignee_id?: string | null
          blocked_by?: string[] | null
          blocking?: string[] | null
          complexity_score?: number | null
          created_at?: string | null
          custom_fields?: Json | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          labels?: Json | null
          last_activity_at?: string | null
          milestone_id?: string | null
          position?: number | null
          priority?: string
          project_id: string
          status?: string
          time_tracking?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assignee_id?: string | null
          blocked_by?: string[] | null
          blocking?: string[] | null
          complexity_score?: number | null
          created_at?: string | null
          custom_fields?: Json | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          labels?: Json | null
          last_activity_at?: string | null
          milestone_id?: string | null
          position?: number | null
          priority?: string
          project_id?: string
          status?: string
          time_tracking?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_attachments: {
        Row: {
          id: string
          name: string
          size: number
          ticket_message_id: string
          type: string
          url: string
        }
        Insert: {
          id?: string
          name: string
          size: number
          ticket_message_id: string
          type: string
          url: string
        }
        Update: {
          id?: string
          name?: string
          size?: number
          ticket_message_id?: string
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_attachments_ticket_message_id_fkey"
            columns: ["ticket_message_id"]
            isOneToOne: false
            referencedRelation: "ticket_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          author_id: string
          author_name: string
          author_role: string
          content: string
          created_at: string | null
          id: string
          ticket_id: string
        }
        Insert: {
          author_id: string
          author_name: string
          author_role: string
          content: string
          created_at?: string | null
          id?: string
          ticket_id: string
        }
        Update: {
          author_id?: string
          author_name?: string
          author_role?: string
          content?: string
          created_at?: string | null
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          category_id: string | null
          company_id: string
          created_at: string | null
          description: string
          id: string
          is_proactive: boolean | null
          number: string
          priority: string
          proactive_analysis: Json | null
          status: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category_id?: string | null
          company_id: string
          created_at?: string | null
          description: string
          id?: string
          is_proactive?: boolean | null
          number: string
          priority: string
          proactive_analysis?: Json | null
          status: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category_id?: string | null
          company_id?: string
          created_at?: string | null
          description?: string
          id?: string
          is_proactive?: boolean | null
          number?: string
          priority?: string
          proactive_analysis?: Json | null
          status?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ticket_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          company_id: string | null
          created_at: string | null
          deleted_at: string | null
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          phone: string | null
          role: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email: string
          first_name: string
          id: string
          is_active?: boolean
          last_name: string
          phone?: string | null
          role: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          phone?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_activity_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      configure_sentiment_analysis_settings: {
        Args: { p_supabase_url: string; p_supabase_anon_key: string }
        Returns: undefined
      }
      create_payment_transactions_table: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_employee_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { p_user_id: string }
        Returns: string
      }
      monitor_contract_obligations: {
        Args: Record<PropertyKey, never>
        Returns: {
          contract_id: string
          alerts_created: number
        }[]
      }
      reorder_tasks: {
        Args: { task_ids: string[]; new_positions: number[] }
        Returns: boolean
      }
      schedule_contract_monitoring: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_devis_status_by_client: {
        Args: {
          quote_id: string
          new_status: string
          rejection_reason_text?: string
        }
        Returns: {
          amount: number
          company_id: string
          created_at: string | null
          id: string
          notes: string | null
          number: string
          object: string
          original_amount: number | null
          rejection_reason: string | null
          status: string
          valid_until: string
          validated_at: string | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
