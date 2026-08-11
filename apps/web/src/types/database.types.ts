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
          created_at?: string
        }
        Update: {
          title?: string | null
          message?: string | null
          body?: string | null
          read?: boolean
        }
        Relationships: []
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
          status: 'pending' | 'paid' | 'cancelled'
          billing_period: 'monthly' | 'yearly'
          issued_at: string
          due_at: string
          paid_at: string | null
          notes: string | null
          pdf_url: string | null
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
          status?: 'pending' | 'paid' | 'cancelled'
          billing_period?: 'monthly' | 'yearly'
          issued_at?: string
          due_at?: string
          paid_at?: string | null
          notes?: string | null
          pdf_url?: string | null
        }
        Update: {
          status?: 'pending' | 'paid' | 'cancelled'
          payment_ref?: string | null
          paid_at?: string | null
          notes?: string | null
          pdf_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
