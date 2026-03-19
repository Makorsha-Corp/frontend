import { useAuth } from "@/context/AuthContext"
import { Button } from "../ui/button"
import { CircleUser } from "lucide-react"
import { supabase_client } from "@/services/SupabaseClient"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

const UserDropdownPanel = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const { error } = await supabase_client.auth.signOut()
    if (error) {
      toast.error(error.message)
    } else {
      navigate("/login2")
    }
  }

  return (
    <div className="w-[300px] p-4">

      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="rounded-full bg-mute p-2">
          <CircleUser className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium leading-none">{profile?.name}</p>
          <p className="text-xs text-muted-foreground">{profile?.email}</p>
        </div>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        Role: <span className="capitalize font-medium text-foreground">{profile?.position}</span>
      </div>


      <div className="pt-4">
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </div>
  )
}

export default UserDropdownPanel
