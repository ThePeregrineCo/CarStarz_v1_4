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
      // Identity Registry - Single source of truth for wallet addresses
      identity_registry: {
        Row: {
          id: string
          wallet_address: string
          normalized_wallet: string
          username: string
          display_name: string
          bio: string | null
          profile_image_url: string | null
          banner_image_url: string | null
          email: string | null
          ens_name: string | null
          did: string | null
          is_admin: boolean
          is_profile_complete: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          normalized_wallet?: string
          username: string
          display_name: string
          bio?: string | null
          profile_image_url?: string | null
          banner_image_url?: string | null
          email?: string | null
          ens_name?: string | null
          did?: string | null
          is_admin?: boolean
          is_profile_complete?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          normalized_wallet?: string
          username?: string
          display_name?: string
          bio?: string | null
          profile_image_url?: string | null
          banner_image_url?: string | null
          email?: string | null
          ens_name?: string | null
          did?: string | null
          is_admin?: boolean
          is_profile_complete?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      // Social Links
      social_links: {
        Row: {
          id: string
          identity_id: string
          platform: string
          url: string
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          identity_id: string
          platform: string
          url: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          identity_id?: string
          platform?: string
          url?: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      // Follows
      follows: {
        Row: {
          id: string
          follower_id: string
          followed_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          followed_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          followed_id?: string
          created_at?: string
        }
      }
      
      // Vehicle Profiles
      vehicle_profiles: {
        Row: {
          id: string
          token_id: number
          vin: string
          make: string
          model: string
          year: number
          name: string | null
          description: string | null
          owner_id: string
          primary_image_url: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          token_id: number
          vin: string
          make: string
          model: string
          year: number
          name?: string | null
          description?: string | null
          owner_id: string
          primary_image_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          token_id?: number
          vin?: string
          make?: string
          model?: string
          year?: number
          name?: string | null
          description?: string | null
          owner_id?: string
          primary_image_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      
      // Vehicle Modifications
      vehicle_modifications: {
        Row: {
          id: string
          vehicle_id: string
          name: string
          description: string | null
          category: string
          image_url: string | null
          link_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          name: string
          description?: string | null
          category: string
          image_url?: string | null
          link_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          name?: string
          description?: string | null
          category?: string
          image_url?: string | null
          link_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      // Vehicle Media
      vehicle_media: {
        Row: {
          id: string
          vehicle_id: string
          url: string
          type: string
          caption: string | null
          category: string | null
          is_featured: boolean
          metadata: Json | null
          context: string | null
          upload_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          url: string
          type: string
          caption?: string | null
          category?: string | null
          is_featured?: boolean
          metadata?: Json | null
          context?: string | null
          upload_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          url?: string
          type?: string
          caption?: string | null
          category?: string | null
          is_featured?: boolean
          metadata?: Json | null
          context?: string | null
          upload_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      // Vehicle Links
      vehicle_links: {
        Row: {
          id: string
          vehicle_id: string
          title: string
          url: string
          type: string
          icon: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          title: string
          url: string
          type: string
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          title?: string
          url?: string
          type?: string
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      // Vehicle Specifications
      vehicle_specifications: {
        Row: {
          id: string
          vehicle_id: string
          category: string
          name: string
          value: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          category: string
          name: string
          value: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          category?: string
          name?: string
          value?: string
          created_at?: string
          updated_at?: string
        }
      }
      
      // Vehicle Comments
      vehicle_comments: {
        Row: {
          id: string
          vehicle_id: string
          commenter_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          commenter_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          commenter_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      
      // Vehicle Audit Log
      vehicle_audit_log: {
        Row: {
          id: string
          vehicle_id: string
          action: string
          performed_by: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          action: string
          performed_by: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          action?: string
          performed_by?: string
          details?: Json | null
          created_at?: string
        }
      }
      
      // Vehicle Videos
      vehicle_videos: {
        Row: {
          id: string
          vehicle_id: string
          title: string
          youtube_url: string
          description: string | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          title: string
          youtube_url: string
          description?: string | null
          date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          title?: string
          youtube_url?: string
          description?: string | null
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      
      // User Collections
      user_collections: {
        Row: {
          id: string
          user_id: string
          vehicle_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vehicle_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          vehicle_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      
      // Token Ownership
      token_ownership: {
        Row: {
          token_id: number
          identity_id: string
          vehicle_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          token_id: number
          identity_id: string
          vehicle_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          token_id?: number
          identity_id?: string
          vehicle_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      
      // Ownership Transfers
      ownership_transfers: {
        Row: {
          id: string
          token_id: number
          vehicle_id: string
          from_identity_id: string | null
          to_identity_id: string
          transaction_hash: string | null
          block_number: number | null
          transfer_date: string
        }
        Insert: {
          id?: string
          token_id: number
          vehicle_id: string
          from_identity_id?: string | null
          to_identity_id: string
          transaction_hash?: string | null
          block_number?: number | null
          transfer_date?: string
        }
        Update: {
          id?: string
          token_id?: number
          vehicle_id?: string
          from_identity_id?: string | null
          to_identity_id?: string
          transaction_hash?: string | null
          block_number?: number | null
          transfer_date?: string
        }
      }
      
      // Verification Authorities
      verification_authorities: {
        Row: {
          id: string
          name: string
          description: string | null
          website_url: string | null
          logo_url: string | null
          contact_email: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          website_url?: string | null
          logo_url?: string | null
          contact_email?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          website_url?: string | null
          logo_url?: string | null
          contact_email?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      
      // Verification Levels
      verification_levels: {
        Row: {
          id: string
          name: string
          description: string | null
          level_order: number
          badge_url: string | null
          requirements: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          level_order: number
          badge_url?: string | null
          requirements?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          level_order?: number
          badge_url?: string | null
          requirements?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      // Vehicle Verifications
      vehicle_verifications: {
        Row: {
          id: string
          vehicle_id: string
          authority_id: string
          level_id: string
          verification_date: string
          expiration_date: string | null
          verification_proof: string | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          authority_id: string
          level_id: string
          verification_date?: string
          expiration_date?: string | null
          verification_proof?: string | null
          status: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          authority_id?: string
          level_id?: string
          verification_date?: string
          expiration_date?: string | null
          verification_proof?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      // Likes
      likes: {
        Row: {
          id: string
          user_id: string
          content_type: string
          content_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_type: string
          content_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_type?: string
          content_id?: string
          created_at?: string
        }
      }
      
      // Shares
      shares: {
        Row: {
          id: string
          user_id: string
          vehicle_id: string
          share_platform: string
          share_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vehicle_id: string
          share_platform: string
          share_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          vehicle_id?: string
          share_platform?: string
          share_url?: string | null
          created_at?: string
        }
      }
      
      // Page Views
      page_views: {
        Row: {
          id: string
          page_type: string
          content_id: string | null
          user_id: string | null
          session_id: string | null
          ip_address: string | null
          user_agent: string | null
          referrer: string | null
          view_date: string
        }
        Insert: {
          id?: string
          page_type: string
          content_id?: string | null
          user_id?: string | null
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          view_date?: string
        }
        Update: {
          id?: string
          page_type?: string
          content_id?: string | null
          user_id?: string | null
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          view_date?: string
        }
      }
    }
    Views: {
      vehicle_profiles_with_owner: {
        Row: {
          id: string
          token_id: number
          vin: string
          make: string
          model: string
          year: number
          name: string | null
          description: string | null
          owner_id: string
          primary_image_url: string | null
          status: string
          created_at: string
          updated_at: string
          owner_wallet: string
          normalized_wallet: string
          owner_username: string | null
          owner_display_name: string | null
          owner_profile_image: string | null
          is_profile_complete: boolean
        }
      }
      blockchain_status: {
        Row: {
          token_id: number
          wallet_address: string
          normalized_wallet: string
          vehicle_id: string
          make: string
          model: string
          year: number
          owner_username: string | null
          owner_display_name: string | null
          is_profile_complete: boolean
        }
      }
    }
    Functions: {
      normalize_wallet_address: {
        Args: Record<string, never>
        Returns: unknown
      }
      validate_profile_fields: {
        Args: Record<string, never>
        Returns: unknown
      }
      sync_token_ownership: {
        Args: Record<string, never>
        Returns: unknown
      }
      process_blockchain_transfer: {
        Args: {
          p_token_id: number
          p_from_wallet: string
          p_to_wallet: string
          p_transaction_hash: string
          p_block_number: number
        }
        Returns: string
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      current_user_identity_id: {
        Args: Record<string, never>
        Returns: string
      }
      owns_vehicle: {
        Args: {
          vehicle_id: string
        }
        Returns: boolean
      }
      verify_setup: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}