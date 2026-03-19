import { useEffect, useState } from "react";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Pencil, KeyRound, PencilOff, Check, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getAllUserProfiles, updatePassword, updateProfile } from "@/services/ProfilesService";
// import { resetUserPassword, updateProfile } from "@/services/ProfilesService"; // Uncomment when adding logic

type Mode = "edit" | "reset" | null;

const ManageUserManagementCard = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingMode, setEditingMode] = useState<Mode>(null);
  const [email, setEmail] = useState("");
  const [editedData, setEditedData] = useState({
    name: "",
    permission: "",
    position: "",
  });
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const data = await getAllUserProfiles();
      if (data) setProfiles(data);
    } catch {
      toast.error("Failed to load profiles.");
    }
  };

  // --- Placeholder functions for updating ---
  const handleUpdateProfile = async (id: number) => { 
    if (!id || !editedData.name || !editedData.permission || !editedData.position) {
      toast.error("All form fields need to be filled");
      return;
    }
    const is_successful_update = await updateProfile(id, editedData.name, editedData.permission, editedData.position)
    if (is_successful_update){
      toast.success("User profile was updated successfully")
      loadProfiles()
      resetForm()
    }
    else{
      toast.success("Failed to update user profile")
    }
  };
  // const handleResetPassword = async (id: number) => { ... };

  const resetForm = () => {
    setEditingId(null);
    setEditingMode(null);
    setEditedData({ name: "", permission: "", position: "" });
    setPasswords({ new: "", confirm: "" });
    setEmail("");
  };

  return (
    <div className="w-full h-[420px]">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Manage Users</h2>

      <AnimatePresence mode="wait">
        {editingId && editingMode === "edit" && (
          <motion.div
            key="edit-mode"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 border rounded-md p-4 shadow-md bg-white"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Input
                value={editedData.name}
                onChange={(e) =>
                  setEditedData({ ...editedData, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Permission
              </label>
              <select
                value={editedData.permission}
                onChange={(e) =>
                  setEditedData({ ...editedData, permission: e.target.value })
                }
                className="w-full border rounded-md p-2"
              >
                <option value="">Select permission</option>
                <option value="department">Department</option>
                <option value="finance">Finance</option>
                <option value="admin">Admin</option>
                <option value="directorTechnical">Director (Technical)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <Input
                value={editedData.position}
                onChange={(e) =>
                  setEditedData({ ...editedData, position: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button className="bg-green-600 text-white" onClick={()=>handleUpdateProfile(editingId)}>
                <Check size={16} className="mr-1" />
                Save
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <PencilOff size={16} className="mr-1" />
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {editingId && editingMode === "reset" && (
          <motion.div
            key="reset-mode"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 rounded-md p-4 shadow-md bg-white"
          >
            <p className="text-sm text-gray-700">
              Resetting password for <span className="font-medium">{email}</span>
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <Input
                type="password"
                value={passwords.new}
                onChange={(e) =>
                  setPasswords({ ...passwords, new: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <Input
                type="password"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords({ ...passwords, confirm: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button className="bg-green-600 text-white" onClick={()=>updatePassword('who','bro')}>
                <Check size={16} className="mr-1" />
                Confirm
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <XCircle size={16} className="mr-1" />
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {!editingId && (
          <motion.div
            key="table-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="rounded-md h-[350px] shadow-md overflow-y-auto w-full"
          >
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>{profile.name}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(profile.id);
                          setEditingMode("edit");
                          setEditedData({
                            name: profile.name,
                            permission: profile.permission,
                            position: profile.position,
                          });
                        }}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(profile.id);
                          setEditingMode("reset");
                          setEmail(profile.email);
                        }}
                      >
                        <KeyRound size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageUserManagementCard;
