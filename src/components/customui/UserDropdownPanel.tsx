import { useAuth } from "@/context/AuthContext"
import { Button } from "../ui/button"
import { CircleUser } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAppDispatch } from "@/app/hooks"
import { logout } from "@/features/auth/authSlice"

const UserDropdownPanel = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const handleLogout = () => {
    dispatch(logout())
    navigate("/login2")
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
