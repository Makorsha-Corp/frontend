import toast from "react-hot-toast";
import { supabase_client } from "./SupabaseClient";


export async function login(email: string, password: string) {
  const { data, error } = await supabase_client.auth.signInWithPassword({ email, password });

  if (error) {
    toast.error(error.message);
  }

  return data;
}
