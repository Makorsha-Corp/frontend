import { Profile } from "@/types";
import { supabase_client } from "./SupabaseClient";
import toast from "react-hot-toast";

export async function getUserProfile(user_id: string) {
    const { data, error } = await supabase_client
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (error) {
      toast.error(error.message)
    }
    
    return data as Profile;
  }
  

  export async function getAllUserProfiles(): Promise<Profile[] | null> {
    const { data, error } = await supabase_client
      .from("profiles")
      .select("*");
  
    if (error) {
      toast.error(error.message);
      return null;
    }
  
    return data as Profile[];
  }

  export async function updateProfile(id: number, name: string, permission: string, position: string): Promise<boolean> {
    const {error} = await supabase_client
    .from("profiles")
    .update({name: name, permission: permission, position: position})
    .eq('id',id)

    if(error){
      toast.error(error.message)
      return false
    }
    return true
  }

  export async function updatePassword(uuid: string, new_pass: string): Promise<boolean> {
    // const {data, error} = await supabase_client.
    // if (error) {
    //   toast.error(error.message)
    // }
    // if (data) {
    //   console.log(data)
    // }

    return true
  }
