import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";
import { fetchAppSettings, updateEnabledSettings } from "@/services/AppSettingsService";

const AppSettingsManagementCard = () => {
  const [enableAddPart, setEnableAddPart] = useState<boolean>(true);
  const [enableCreateOrder, setEnableCreateOrder] = useState<boolean>(true);

  const loadSettings = async () => {
    try {
      const settings_data = await fetchAppSettings();
      if (settings_data) {
        settings_data.forEach((setting) => {
          if (setting.name === "Add Part") setEnableAddPart(setting.enabled);
          if (setting.name === "Create Order") setEnableCreateOrder(setting.enabled);
        });
      }
    } catch (error) {
      toast.error("Could not load settings data");
    }
  };

  const handleToggle = async (name: string, checked: boolean) => {
    try {
      if (name === "Add Part") setEnableAddPart(checked);
      if (name === "Create Order") setEnableCreateOrder(checked);
      await updateEnabledSettings(name, checked);
      toast.success(`Updated ${name} setting`);
    } catch (error) {
      toast.error("Failed to update app settings");
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <Card className="border-0 shadow-none h-full">
      <CardHeader>
        <CardTitle>App Settings</CardTitle>
        <CardDescription>
          The following configuration will be applied for all users.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-full overflow-auto">
        <div className="space-y-4">
          <div className="flex flex-row items-center justify-between rounded-lg p-4">
            <div className="space-y-0.5">
              <label className="text-base font-medium">Add Part</label>
              <p className="text-sm text-muted-foreground">
                Control if users can add part to the system
              </p>
            </div>
            <Switch
              checked={enableAddPart}
              onCheckedChange={(checked) => handleToggle("Add Part", checked)}
            />
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg p-4">
            <div className="space-y-0.5">
              <label className="text-base font-medium">Create Order</label>
              <p className="text-sm text-muted-foreground">
                Control if the users can create new orders
              </p>
            </div>
            <Switch
              checked={enableCreateOrder}
              onCheckedChange={(checked) => handleToggle("Create Order", checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppSettingsManagementCard;
