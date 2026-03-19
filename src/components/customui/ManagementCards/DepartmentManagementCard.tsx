import { useEffect, useState } from "react";
import { Table, TableHead, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { PlusCircle, Plus, X, PencilRuler, PencilOff, Check, XCircle, Trash2, Pencil } from "lucide-react";
import { fetchDepartments, addDepartment, deleteDepartment, updateDepartment } from "@/services/FactoriesService";

const DepartmentManagementCard = () => {
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);

  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState("");

  const [editingDepartmentId, setEditingDepartmentId] = useState<number | null>(null);
  const [editedDepartmentName, setEditedDepartmentName] = useState("");

  // Load departments on mount
  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await fetchDepartments();
      setDepartments(data);
    } catch (error) {
      toast.error("Failed to load departments.");
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) {
      toast.error("Please enter a department name.");
      return;
    }

    try {
      await addDepartment(newDepartmentName);
      toast.success("Department added!");
      setIsAddingDepartment(false);
      setNewDepartmentName("");
      loadDepartments();
    } catch (error) {
      toast.error("Error adding department.");
    }
  };

  const handleDeleteDepartment = async (departmentId: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this department?");
    if (!confirmed) return;

    try {
      await deleteDepartment(departmentId);
      loadDepartments();
    } catch (error) {
      toast.error("Failed to delete department.");
    }
  };

  const handleUpdateDepartment = async (departmentId: number) => {
    if (!editedDepartmentName.trim()) {
      toast.error("Department name cannot be empty.");
      return;
    }

    try {
      await updateDepartment(departmentId, editedDepartmentName);
      setEditingDepartmentId(null);
      setEditedDepartmentName("");
      loadDepartments();
    } catch (error) {
      toast.error("Error updating department.");
    }
  };

  return (
    <>
      {/* Heading and Add Button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Configure Departments</h2>
        <div className="relative group">
          <Button
            onClick={() => {
              if (isAddingDepartment) {
                setIsAddingDepartment(false);
                setNewDepartmentName("");
              } else {
                setIsAddingDepartment(true);
              }
            }}
            className={`flex items-center gap-2 ${
              isAddingDepartment 
                ? "bg-red-600 text-white hover:bg-red-700" 
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isAddingDepartment ? (
              <>
                <X size={18} />
                Cancel
              </>
            ) : (
              <>
                <PlusCircle size={18} />
                Add Department
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Add Department Form */}
      <AnimatePresence mode="wait">
        {isAddingDepartment && (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <Input
                placeholder="Department Name"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                className="w-[260px]"
              />

              <button
                onClick={handleAddDepartment}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded-md border border-blue-600 hover:bg-blue-100 transition"
              >
                <Plus size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Departments Table */}
      <div className="rounded-md border max-h-[500px] overflow-y-auto mt-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>ID</TableHead>
              <TableHead>Department Name</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell>{dept.id}</TableCell>
                <TableCell>
                  {editingDepartmentId === dept.id ? (
                    <Input
                      type="text"
                      value={editedDepartmentName}
                      onChange={(e) => setEditedDepartmentName(e.target.value)}
                      className="border rounded-md p-1 w-60 text-center"
                    />
                  ) : (
                    dept.name
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell className="flex gap-2">
                  {editingDepartmentId === dept.id ? (
                    <>
                      <Button size="sm" variant="ghost"
                        onClick={() => {
                          setEditingDepartmentId(null);
                          setEditedDepartmentName("");
                        }}
                      >
                        <PencilOff className="w-4 h-4" />
                      </Button>

                      <Button size="sm" onClick={() => handleUpdateDepartment(dept.id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* Edit Button */}
                      <Button variant="outline" size="sm"
                        onClick={() => {
                          setEditingDepartmentId(dept.id);
                          setEditedDepartmentName(dept.name);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>

                      {/* Delete Button */}
                      <Button variant="destructive" size="sm"
                        onClick={() => handleDeleteDepartment(dept.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default DepartmentManagementCard;
