import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { ManagementType } from "@/types"; // Import the globally declared type
import FactoryManagementCard from "@/components/customui/ManagementCards/FactoryManagementCard";
import FactorySectionManagementCard from "./FactorySectionManagementCard";
import MachineManagementCard from "./MachineManagementCard";
import DepartmentManagementCard from "./DepartmentManagementCard";
import { useSearchParams } from "react-router-dom";
import MachinePartsManagementCard from "./MachinePartsManagementCard";
import AddUserCard from "./AddUserCard";
import ManageUserManagementCard from "./ManageUserManagementCard";
import AppSettingsManagementCard from "./AppSettingsManagementCard";
import PageAccessControlCard from "./PageAccessControlCard";
import ManageOrderAccessControlCard from "./ManageOrderAccessControlCard";
import FeatureAccessControlCard from "./FeatureAccessControlCard";

interface ExpandedManagementCardProps {
  type: ManagementType;
  onClose: () => void;
}

// Object mapping for cleaner component rendering
const managementCards: Record<ManagementType, JSX.Element> = {
  factory: <FactoryManagementCard />,
  factorySections: <FactorySectionManagementCard />,
  machines: <MachineManagementCard />,
  machineParts: <MachinePartsManagementCard />, // Placeholder
  departments: <DepartmentManagementCard />,
  addUser: <AddUserCard/>,
  manageUser: <ManageUserManagementCard/>,
  appSettings: <AppSettingsManagementCard/>,
  pageAccessControl: <PageAccessControlCard/>,
  manageOrderAccessControl: <ManageOrderAccessControlCard/>,
  featureAccessControl: <FeatureAccessControlCard/>
};

const ExpandedManagementCard: React.FC<ExpandedManagementCardProps> = ({ type, onClose }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const managementType = searchParams.get("card") as ManagementType | null;
  
  if (!managementType || !managementCards[managementType]) return null; // Close if invalid or not set

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <Card className="bg-white w-[85vw] max-w-5xl h-[82vh] rounded-lg shadow-lg relative overflow-hidden">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-black">
          <X size={20} />
        </button>
        <CardContent className="h-full overflow-hidden p-6 pt-14 pr-12">
          <div className="w-full h-full p-0 min-h-[600px] flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="h-full flex flex-col overflow-hidden">
                {managementCards[managementType]}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpandedManagementCard;
