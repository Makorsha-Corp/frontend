import toast from "react-hot-toast";
import { supabase_client } from "./SupabaseClient";
import { Status } from "@/types";

export const fetchStatuses = async () => {
    const {data, error} = await supabase_client.from('statuses').select('*')
    if (error){
        toast.error(error.message)
    }
    return data as Status[];
};

export const fetchStatusByID = async (status_id:number) => {
    const {data, error} =  await supabase_client.from('statuses').select('*').eq('id', status_id)
    if (error){
        toast.error(error.message)
    }
    return data as Status[]

}