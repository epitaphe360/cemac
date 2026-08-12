export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: string
          phone: string | null
          country: string | null
          language: string
          notification_preferences: Json | null
          password_reset_required: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          phone?: string | null
          country?: string | null
          language?: string
          notification_preferences?: Json | null
          password_reset_required?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          phone?: string | null
          country?: string | null
          language?: string
          notification_preferences?: Json | null
          password_reset_required?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      entreprises: {
        Row: {
          id: string
          owner_id: string
          raison_sociale: string
          sigle: string | null
          secteur_activite: string | null
          pays: string
          ville: string | null
          adresse: string | null
          telephone: string | null
          email_contact: string | null
          site_web: string | null
          numero_contribuable: string | null
          description: string | null
          logo_url: string | null
          subscription_plan: string
          is_verified: boolean
          chambre_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: 'inactive' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          subscription_period: 'monthly' | 'yearly' | null
          subscription_current_period_start: string | null
          subscription_current_period_end: string | null
          subscription_cancel_at_period_end: boolean
          subscription_canceled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          raison_sociale: string
          sigle?: string | null
          secteur_activite?: string | null
          pays: string
          ville?: string | null
          adresse?: string | null
          telephone?: string | null
          email_contact?: string | null
          site_web?: string | null
          numero_contribuable?: string | null
          description?: string | null
          logo_url?: string | null
          subscription_plan?: string
          is_verified?: boolean
          chambre_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: 'inactive' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          subscription_period?: 'monthly' | 'yearly' | null
          subscription_current_period_start?: string | null
          subscription_current_period_end?: string | null
          subscription_cancel_at_period_end?: boolean
          subscription_canceled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          raison_sociale?: string
          sigle?: string | null
          secteur_activite?: string | null
          pays?: string
          ville?: string | null
          adresse?: string | null
          telephone?: string | null
          email_contact?: string | null
          site_web?: string | null
          numero_contribuable?: string | null
          description?: string | null
          logo_url?: string | null
          subscription_plan?: string
          is_verified?: boolean
          chambre_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: 'inactive' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
          subscription_period?: 'monthly' | 'yearly' | null
          subscription_current_period_start?: string | null
          subscription_current_period_end?: string | null
          subscription_cancel_at_period_end?: boolean
          subscription_canceled_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'entreprises_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'entreprises_chambre_id_fkey'
            columns: ['chambre_id']
            isOneToOne: false
            referencedRelation: 'chambres_commerce'
            referencedColumns: ['id']
          },
        ]
      }
      certifications: {
        Row: {
          id: string
          entreprise_id: string
          numero_dossier: string
          type_certification: string
          statut: string
          produit_nom: string
          produit_description: string | null
          pays_production: string
          valeur_ajoutee_locale: number | null
          qr_code_data: string | null
          qr_code_url: string | null
          date_soumission: string | null
          date_approbation: string | null
          date_expiration: string | null
          agent_id: string | null
          chambre_id: string | null
          notes_agent: string | null
          notes_commission: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          entreprise_id: string
          numero_dossier?: string
          type_certification?: string
          statut?: string
          produit_nom: string
          produit_description?: string | null
          pays_production: string
          valeur_ajoutee_locale?: number | null
          qr_code_data?: string | null
          qr_code_url?: string | null
          date_soumission?: string | null
          date_approbation?: string | null
          date_expiration?: string | null
          agent_id?: string | null
          chambre_id?: string | null
          notes_agent?: string | null
          notes_commission?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          statut?: string
          produit_nom?: string
          produit_description?: string | null
          valeur_ajoutee_locale?: number | null
          qr_code_data?: string | null
          qr_code_url?: string | null
          date_soumission?: string | null
          date_approbation?: string | null
          date_expiration?: string | null
          agent_id?: string | null
          chambre_id?: string | null
          notes_agent?: string | null
          notes_commission?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'certifications_entreprise_id_fkey'
            columns: ['entreprise_id']
            isOneToOne: false
            referencedRelation: 'entreprises'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certifications_agent_id_fkey'
            columns: ['agent_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certifications_chambre_id_fkey'
            columns: ['chambre_id']
            isOneToOne: false
            referencedRelation: 'chambres_commerce'
            referencedColumns: ['id']
          },
        ]
      }
      documents: {
        Row: {
          id: string
          certification_id: string
          nom_fichier: string
          type_document: string
          url: string
          taille: number | null
          mime_type: string | null
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          certification_id: string
          nom_fichier: string
          type_document: string
          url: string
          taille?: number | null
          mime_type?: string | null
          uploaded_by: string
          created_at?: string
        }
        Update: { [_ in never]: never }
        Relationships: []
      }
      workflow_events: {
        Row: {
          id: string
          certification_id: string
          statut_precedent: string | null
          statut_nouveau: string
          commentaire: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          certification_id: string
          statut_precedent?: string | null
          statut_nouveau: string
          commentaire?: string | null
          created_by: string
          created_at?: string
        }
        Update: { [_ in never]: never }
        Relationships: []
      }
      produits: {
        Row: {
          id: string
          entreprise_id: string
          certification_id: string | null
          nom: string
          description: string | null
          categorie: string | null
          sous_categorie: string | null
          prix_unitaire: number | null
          devise: string
          unite: string | null
          quantite_disponible: number | null
          pays_origine: string
          images: string[]
          tags: string[]
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          entreprise_id: string
          certification_id?: string | null
          nom: string
          description?: string | null
          categorie?: string | null
          sous_categorie?: string | null
          prix_unitaire?: number | null
          devise?: string
          unite?: string | null
          quantite_disponible?: number | null
          pays_origine: string
          images?: string[]
          tags?: string[]
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          nom?: string
          description?: string | null
          categorie?: string | null
          sous_categorie?: string | null
          prix_unitaire?: number | null
          devise?: string
          unite?: string | null
          quantite_disponible?: number | null
          images?: string[]
          tags?: string[]
          is_published?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'produits_entreprise_id_fkey'
            columns: ['entreprise_id']
            isOneToOne: false
            referencedRelation: 'entreprises'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'produits_certification_id_fkey'
            columns: ['certification_id']
            isOneToOne: false
            referencedRelation: 'certifications'
            referencedColumns: ['id']
          },
        ]
      }
      chambres_commerce: {
        Row: {
          id: string
          nom: string
          pays: string
          ville: string
          email: string | null
          telephone: string | null
          agent_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nom: string
          pays: string
          ville: string
          email?: string | null
          telephone?: string | null
          agent_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          nom?: string
          pays?: string
          ville?: string
          email?: string | null
          telephone?: string | null
          agent_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      convoys: {
        Row: {
          id: string
          reference: string
          name: string
          country: string
          origin: string
          destination: string
          status: 'draft' | 'planned' | 'operational' | 'completed' | 'cancelled'
          agent_id: string | null
          planned_departure: string | null
          planned_arrival: string | null
          actual_departure: string | null
          actual_arrival: string | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reference?: string
          name: string
          country: string
          origin: string
          destination: string
          status?: 'draft' | 'planned' | 'operational' | 'completed' | 'cancelled'
          agent_id?: string | null
          planned_departure?: string | null
          planned_arrival?: string | null
          actual_departure?: string | null
          actual_arrival?: string | null
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          country?: string
          origin?: string
          destination?: string
          status?: 'draft' | 'planned' | 'operational' | 'completed' | 'cancelled'
          agent_id?: string | null
          planned_departure?: string | null
          planned_arrival?: string | null
          actual_departure?: string | null
          actual_arrival?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expeditions: {
        Row: {
          id: string
          reference: string
          entreprise_id: string
          certification_id: string
          convoy_id: string | null
          assigned_agent_id: string | null
          status: 'draft' | 'ready' | 'in_transit' | 'checkpoint_hold' | 'delivered' | 'cancelled'
          origin_country: string
          origin_city: string
          destination_country: string
          destination_city: string
          goods_description: string
          gross_weight_kg: number | null
          package_count: number | null
          declared_value: number | null
          currency: string
          expected_departure: string | null
          expected_arrival: string | null
          delivered_at: string | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reference?: string
          entreprise_id: string
          certification_id: string
          convoy_id?: string | null
          assigned_agent_id?: string | null
          status?: 'draft' | 'ready' | 'in_transit' | 'checkpoint_hold' | 'delivered' | 'cancelled'
          origin_country: string
          origin_city: string
          destination_country: string
          destination_city: string
          goods_description: string
          gross_weight_kg?: number | null
          package_count?: number | null
          declared_value?: number | null
          currency?: string
          expected_departure?: string | null
          expected_arrival?: string | null
          delivered_at?: string | null
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          convoy_id?: string | null
          assigned_agent_id?: string | null
          status?: 'draft' | 'ready' | 'in_transit' | 'checkpoint_hold' | 'delivered' | 'cancelled'
          origin_country?: string
          origin_city?: string
          destination_country?: string
          destination_city?: string
          goods_description?: string
          gross_weight_kg?: number | null
          package_count?: number | null
          declared_value?: number | null
          currency?: string
          expected_departure?: string | null
          expected_arrival?: string | null
          delivered_at?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expedition_events: {
        Row: {
          id: string
          expedition_id: string
          event_type: 'created' | 'status' | 'checkpoint' | 'note' | 'document'
          previous_status: string | null
          new_status: string | null
          title: string
          description: string | null
          location: string | null
          metadata: Json
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          expedition_id: string
          event_type: 'created' | 'status' | 'checkpoint' | 'note' | 'document'
          previous_status?: string | null
          new_status?: string | null
          title: string
          description?: string | null
          location?: string | null
          metadata?: Json
          created_by: string
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      expedition_documents: {
        Row: {
          id: string
          expedition_id: string
          document_type: 'eur1' | 'invoice' | 'packing_list' | 'customs' | 'transport' | 'insurance' | 'other'
          file_name: string
          storage_path: string
          mime_type: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp'
          file_size: number
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          expedition_id: string
          document_type: 'eur1' | 'invoice' | 'packing_list' | 'customs' | 'transport' | 'insurance' | 'other'
          file_name: string
          storage_path: string
          mime_type: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp'
          file_size: number
          uploaded_by: string
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      corridors: {
        Row: {
          id: string
          route: string
          mode: 'Route' | 'Maritime' | 'Aérien' | 'Ferroviaire' | 'Mixte'
          days: string
          status: 'Opérationnel' | 'Ralenti' | 'Bloqué' | 'En maintenance'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          route: string
          mode?: 'Route' | 'Maritime' | 'Aérien' | 'Ferroviaire' | 'Mixte'
          days: string
          status?: 'Opérationnel' | 'Ralenti' | 'Bloqué' | 'En maintenance'
          created_at?: string
          updated_at?: string
        }
        Update: {
          route?: string
          mode?: 'Route' | 'Maritime' | 'Aérien' | 'Ferroviaire' | 'Mixte'
          days?: string
          status?: 'Opérationnel' | 'Ralenti' | 'Bloqué' | 'En maintenance'
          updated_at?: string
        }
        Relationships: []
      }
      logistics_alerts: {
        Row: {
          id: string
          country: string
          message: string
          type: 'info' | 'warning' | 'danger'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          country: string
          message: string
          type?: 'info' | 'warning' | 'danger'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          country?: string
          message?: string
          type?: 'info' | 'warning' | 'danger'
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string | null
          message: string | null
          body: string | null
          read: boolean
          certification_id: string | null
          expedition_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title?: string | null
          message?: string | null
          body?: string | null
          read?: boolean
          certification_id?: string | null
          expedition_id?: string | null
          created_at?: string
        }
        Update: {
          title?: string | null
          message?: string | null
          body?: string | null
          read?: boolean
          certification_id?: string | null
          expedition_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_certification_id_fkey'
            columns: ['certification_id']
            isOneToOne: false
            referencedRelation: 'certifications'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_expedition_id_fkey'
            columns: ['expedition_id']
            isOneToOne: false
            referencedRelation: 'expeditions'
            referencedColumns: ['id']
          },
        ]
      }
      contact_requests: {
        Row: {
          id: string
          full_name: string
          email: string
          company: string | null
          country: string | null
          reason: string | null
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          company?: string | null
          country?: string | null
          reason?: string | null
          message: string
          created_at?: string
        }
        Update: {
          full_name?: string
          email?: string
          company?: string | null
          country?: string | null
          reason?: string | null
          message?: string
        }
        Relationships: []
      }
      api_configs: {
        Row: {
          id: string
          key: string
          name: string
          category: string
          config: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          name: string
          category?: string
          config?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          category?: string
          config?: Json
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          user_id: string
          company_id: string | null
          plan_name: string
          amount_ht: number
          tax_rate: number
          tax_amount: number
          amount_ttc: number
          currency: string
          country: string
          payment_method: string
          payment_ref: string | null
          status: 'pending' | 'paid' | 'cancelled' | 'failed'
          billing_period: 'monthly' | 'yearly'
          issued_at: string
          due_at: string
          paid_at: string | null
          notes: string | null
          pdf_url: string | null
          stripe_invoice_id: string | null
          stripe_subscription_id: string | null
          stripe_payment_intent_id: string | null
          hosted_invoice_url: string | null
          stripe_invoice_pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_number: string
          user_id: string
          company_id?: string | null
          plan_name: string
          amount_ht: number
          tax_rate?: number
          tax_amount?: number
          amount_ttc: number
          currency?: string
          country?: string
          payment_method?: string
          payment_ref?: string | null
          status?: 'pending' | 'paid' | 'cancelled' | 'failed'
          billing_period?: 'monthly' | 'yearly'
          issued_at?: string
          due_at?: string
          paid_at?: string | null
          notes?: string | null
          pdf_url?: string | null
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
          stripe_payment_intent_id?: string | null
          hosted_invoice_url?: string | null
          stripe_invoice_pdf_url?: string | null
        }
        Update: {
          status?: 'pending' | 'paid' | 'cancelled' | 'failed'
          payment_ref?: string | null
          paid_at?: string | null
          notes?: string | null
          pdf_url?: string | null
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
          stripe_payment_intent_id?: string | null
          hosted_invoice_url?: string | null
          stripe_invoice_pdf_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          stripe_object_id: string | null
          user_id: string | null
          entreprise_id: string | null
          processed_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          stripe_object_id?: string | null
          user_id?: string | null
          entreprise_id?: string | null
          processed_at?: string
        }
        Update: { [_ in never]: never }
        Relationships: [
          {
            foreignKeyName: 'stripe_webhook_events_entreprise_id_fkey'
            columns: ['entreprise_id']
            isOneToOne: false
            referencedRelation: 'entreprises'
            referencedColumns: ['id']
          },
        ]
      }
      site_settings: {
        Row: { key: string; value: Json; description: string | null; is_public: boolean; created_at: string; updated_at: string }
        Insert: { key: string; value?: Json; description?: string | null; is_public?: boolean; created_at?: string; updated_at?: string }
        Update: { value?: Json; description?: string | null; is_public?: boolean; updated_at?: string }
        Relationships: []
      }
      content_blocks: {
        Row: { id: string; page: string; section: string; key: string; locale: string; content: Json; media_url: string | null; sort_order: number; is_published: boolean; published_at: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; page: string; section: string; key: string; locale?: string; content?: Json; media_url?: string | null; sort_order?: number; is_published?: boolean; published_at?: string | null; created_at?: string; updated_at?: string }
        Update: { page?: string; section?: string; key?: string; locale?: string; content?: Json; media_url?: string | null; sort_order?: number; is_published?: boolean; published_at?: string | null; updated_at?: string }
        Relationships: []
      }
      team_members: {
        Row: { id: string; slug: string; full_name: string; role: Json; country_code: string | null; country_label: Json; initials: string | null; photo_url: string | null; sort_order: number; is_published: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; slug: string; full_name: string; role: Json; country_code?: string | null; country_label?: Json; initials?: string | null; photo_url?: string | null; sort_order?: number; is_published?: boolean; created_at?: string; updated_at?: string }
        Update: { slug?: string; full_name?: string; role?: Json; country_code?: string | null; country_label?: Json; initials?: string | null; photo_url?: string | null; sort_order?: number; is_published?: boolean; updated_at?: string }
        Relationships: []
      }
      partners: {
        Row: { id: string; slug: string; name: string; description: Json; logo_url: string | null; website_url: string | null; sort_order: number; is_published: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; slug: string; name: string; description?: Json; logo_url?: string | null; website_url?: string | null; sort_order?: number; is_published?: boolean; created_at?: string; updated_at?: string }
        Update: { slug?: string; name?: string; description?: Json; logo_url?: string | null; website_url?: string | null; sort_order?: number; is_published?: boolean; updated_at?: string }
        Relationships: []
      }
      milestones: {
        Row: { id: string; slug: string; year: number; title: Json; description: Json; sort_order: number; is_published: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; slug: string; year: number; title?: Json; description: Json; sort_order?: number; is_published?: boolean; created_at?: string; updated_at?: string }
        Update: { slug?: string; year?: number; title?: Json; description?: Json; sort_order?: number; is_published?: boolean; updated_at?: string }
        Relationships: []
      }
      marketing_stats: {
        Row: { key: string; label: Json; display_value: Json; numeric_value: number | null; source: string | null; sort_order: number; is_published: boolean; created_at: string; updated_at: string }
        Insert: { key: string; label: Json; display_value: Json; numeric_value?: number | null; source?: string | null; sort_order?: number; is_published?: boolean; created_at?: string; updated_at?: string }
        Update: { label?: Json; display_value?: Json; numeric_value?: number | null; source?: string | null; sort_order?: number; is_published?: boolean; updated_at?: string }
        Relationships: []
      }
      pricing_plans: {
        Row: { id: string; name: Json; description: Json; monthly_price: number | null; yearly_price: number | null; currency: string; badge: Json | null; cta: Json; sort_order: number; is_published: boolean; created_at: string; updated_at: string }
        Insert: { id: string; name: Json; description: Json; monthly_price?: number | null; yearly_price?: number | null; currency?: string; badge?: Json | null; cta?: Json; sort_order?: number; is_published?: boolean; created_at?: string; updated_at?: string }
        Update: { name?: Json; description?: Json; monthly_price?: number | null; yearly_price?: number | null; currency?: string; badge?: Json | null; cta?: Json; sort_order?: number; is_published?: boolean; updated_at?: string }
        Relationships: []
      }
      pricing_plan_features: {
        Row: { id: string; plan_id: string; feature_key: string; label: Json; is_included: boolean; sort_order: number; created_at: string; updated_at: string }
        Insert: { id?: string; plan_id: string; feature_key: string; label: Json; is_included?: boolean; sort_order?: number; created_at?: string; updated_at?: string }
        Update: { plan_id?: string; feature_key?: string; label?: Json; is_included?: boolean; sort_order?: number; updated_at?: string }
        Relationships: [
          {
            foreignKeyName: 'pricing_plan_features_plan_id_fkey'
            columns: ['plan_id']
            isOneToOne: false
            referencedRelation: 'pricing_plans'
            referencedColumns: ['id']
          },
        ]
      }
      pricing_faqs: {
        Row: { id: string; slug: string; question: Json; answer: Json; sort_order: number; is_published: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; slug: string; question: Json; answer: Json; sort_order?: number; is_published?: boolean; created_at?: string; updated_at?: string }
        Update: { slug?: string; question?: Json; answer?: Json; sort_order?: number; is_published?: boolean; updated_at?: string }
        Relationships: []
      }
      contact_offices: {
        Row: { id: string; slug: string; country_code: string; country_name: Json; city: string; address: Json; phone: string | null; email: string | null; is_headquarters: boolean; sort_order: number; is_published: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; slug: string; country_code: string; country_name: Json; city: string; address: Json; phone?: string | null; email?: string | null; is_headquarters?: boolean; sort_order?: number; is_published?: boolean; created_at?: string; updated_at?: string }
        Update: { slug?: string; country_code?: string; country_name?: Json; city?: string; address?: Json; phone?: string | null; email?: string | null; is_headquarters?: boolean; sort_order?: number; is_published?: boolean; updated_at?: string }
        Relationships: []
      }
      contact_reasons: {
        Row: { id: string; slug: string; label: Json; sort_order: number; is_published: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; slug: string; label: Json; sort_order?: number; is_published?: boolean; created_at?: string; updated_at?: string }
        Update: { slug?: string; label?: Json; sort_order?: number; is_published?: boolean; updated_at?: string }
        Relationships: []
      }
      commodity_baselines: {
        Row: { id: string; key: string; world_bank_indicator: string | null; name: Json; country_code: string; xaf_unit: Json; category: Json; usd_unit: string; usd_price: number; source_url: string | null; sort_order: number; is_published: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; key: string; world_bank_indicator?: string | null; name: Json; country_code: string; xaf_unit: Json; category: Json; usd_unit: string; usd_price: number; source_url?: string | null; sort_order?: number; is_published?: boolean; created_at?: string; updated_at?: string }
        Update: { key?: string; world_bank_indicator?: string | null; name?: Json; country_code?: string; xaf_unit?: Json; category?: Json; usd_unit?: string; usd_price?: number; source_url?: string | null; sort_order?: number; is_published?: boolean; updated_at?: string }
        Relationships: []
      }
      assistant_knowledge: {
        Row: { id: string; slug: string; patterns: string[]; answer: Json; suggestion: Json; tags: string[]; sort_order: number; is_published: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; slug: string; patterns?: string[]; answer: Json; suggestion?: Json; tags?: string[]; sort_order?: number; is_published?: boolean; created_at?: string; updated_at?: string }
        Update: { slug?: string; patterns?: string[]; answer?: Json; suggestion?: Json; tags?: string[]; sort_order?: number; is_published?: boolean; updated_at?: string }
        Relationships: []
      }
      legal_documents: {
        Row: { id: string; slug: string; locale: string; title: string; sections: Json; effective_date: string; is_published: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; slug: string; locale: string; title: string; sections: Json; effective_date: string; is_published?: boolean; created_at?: string; updated_at?: string }
        Update: { slug?: string; locale?: string; title?: string; sections?: Json; effective_date?: string; is_published?: boolean; updated_at?: string }
        Relationships: []
      }
      product_categories: {
        Row: { id: string; slug: string; label: Json; sort_order: number; is_published: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; slug: string; label: Json; sort_order?: number; is_published?: boolean; created_at?: string; updated_at?: string }
        Update: { slug?: string; label?: Json; sort_order?: number; is_published?: boolean; updated_at?: string }
        Relationships: []
      }
      tax_rates: {
        Row: { country_code: string; country_name: Json; rate: number; effective_from: string; source: string | null; is_active: boolean; created_at: string; updated_at: string }
        Insert: { country_code: string; country_name: Json; rate: number; effective_from: string; source?: string | null; is_active?: boolean; created_at?: string; updated_at?: string }
        Update: { country_name?: Json; rate?: number; effective_from?: string; source?: string | null; is_active?: boolean; updated_at?: string }
        Relationships: []
      }
    }
    Views: {
      platform_stats: {
        Row: {
          verified_companies: number | null
          approved_certifications: number | null
          total_certifications: number | null
          published_products: number | null
          represented_countries: number | null
          chambers: number | null
          measured_at: string | null
        }
        Relationships: []
      }
      api_config_metadata: {
        Row: {
          id: string | null
          key: string | null
          name: string | null
          category: string | null
          is_active: boolean | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_security_health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_set_subscription_plan: {
        Args: {
          target_entreprise_id: string
          target_plan: string
        }
        Returns: Database['public']['Tables']['entreprises']['Row']
      }
      admin_update_user_role: {
        Args: {
          target_user_id: string
          target_role: string
        }
        Returns: undefined
      }
      auditor_can_access_entreprise: {
        Args: { entreprise_uuid: string }
        Returns: boolean
      }
      can_access_certification: {
        Args: { certification_uuid: string }
        Returns: boolean
      }
      can_manage_cms: {
        Args: { resource_name: string }
        Returns: boolean
      }
      consume_rate_limit: {
        Args: {
          p_scope: string
          p_identifier_hash: string
          p_limit: number
          p_window_seconds: number
        }
        Returns: Json
      }
      get_my_country: {
        Args: Record<PropertyKey, never>
        Returns: string | null
      }
      get_my_entreprise_id: {
        Args: Record<PropertyKey, never>
        Returns: string | null
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string | null
      }
      process_stripe_event: {
        Args: {
          p_event_id: string
          p_event_type: string
          p_stripe_object_id: string | null
          p_user_id: string
          p_entreprise_id: string
          p_plan: string | null
          p_billing_period: string | null
          p_subscription_status: string | null
          p_stripe_customer_id: string | null
          p_stripe_subscription_id: string | null
          p_period_start: string | null
          p_period_end: string | null
          p_cancel_at_period_end: boolean
          p_canceled_at: string | null
          p_stripe_invoice_id: string | null
          p_invoice_number: string | null
          p_invoice_subtotal: number | null
          p_invoice_tax: number | null
          p_invoice_total: number | null
          p_currency: string | null
          p_payment_intent_id: string | null
          p_hosted_invoice_url: string | null
          p_invoice_pdf_url: string | null
        }
        Returns: boolean
      }
      user_notification_enabled: {
        Args: {
          p_user_id: string
          p_preference: string
        }
        Returns: boolean
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
