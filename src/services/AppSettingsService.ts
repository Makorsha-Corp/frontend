import { ApplicationSettings } from "@/types";
import { supabase_client } from "./SupabaseClient";
import toast from "react-hot-toast";

export async function fetchAppSettings() {
    const { data, error } = await supabase_client
      .from('app_settings')
      .select('*')

    if (error) {
      toast.error(error.message)
    }
    
    return data as ApplicationSettings[]
  }
  

export async function updateEnabledSettings(name:string, enable: boolean) {
   const {error} = await supabase_client
   .from('app_settings')
   .update({enabled: enable})
   .eq('name', name)

   if (error) {
    toast.error(error.message)
   }
}
