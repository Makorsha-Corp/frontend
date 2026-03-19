import toast from "react-hot-toast";
import { supabase_client } from "./SupabaseClient";
import { StatusTracker } from "@/types";

export const fetchStatusTrackerByID = async (order_id:number) => {
    const {data,error} = await supabase_client.from('status_tracker').
    select(
        `
            id,
            action_at,
            order_id,
            status_id,
            profiles(
                *
            ),
            statuses(
                *
            )
        `
    ).eq('order_id',order_id).order("action_at", {ascending: true}).order("id", {ascending:true})
    if (error){
        toast.error(error.message)
    }
    console.log(data)
    return data as unknown as StatusTracker[];
};

export const InsertStatusTracker = async (action_at: Date, order_id: number, action_by_user_id:number, status_id: number) =>{
    
    const { error } = await supabase_client.from('status_tracker')
    .insert([
    {   action_at: action_at,
        order_id: order_id,
        action_by_user_id: action_by_user_id,
        status_id: status_id
    },
    ])

    if (error){
        toast.error(error.message)
    }
        
}
