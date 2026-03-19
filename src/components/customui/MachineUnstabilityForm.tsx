import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { fetchFactories, fetchFactorySections } from '@/services/FactoriesService';
import { fetchAllMachines } from "@/services/MachineServices";
import { Factory, FactorySection, Machine } from "@/types";

export type UnstableType = 'defective' | 'less' | '';

interface MachineUnstabilityFormProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    unstableType: UnstableType;
    onUnstableTypeChange: (type: UnstableType) => void;
    onMarkInactiveInstead?: () => void;
    title?: string;
    description?: string;
}

const MachineUnstabilityForm: React.FC<MachineUnstabilityFormProps> = ({
    isOpen,
    onOpenChange,
    unstableType,
    onUnstableTypeChange,
    onMarkInactiveInstead,
    title = "How will you keep the machine running?",
    description = "Since you're not marking the machine as inactive, please specify how it will continue operating."
}) => {
    const handleUnstableTypeSelection = (type: UnstableType) => {
        onUnstableTypeChange(type);
        onOpenChange(false);
    };

    const handleMarkInactiveInstead = () => {
        if (onMarkInactiveInstead) {
            onMarkInactiveInstead();
        }
        onUnstableTypeChange('');
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {description}
                        </p>
                    </div>
                    
                    <div className="space-y-3">
                        {/* Mark Machine as Inactive Option */}
                        <Button
                            variant="outline"
                            className="w-full justify-start text-left h-auto p-4"
                            onClick={handleMarkInactiveInstead}
                        >
                            <div>
                                <div className="font-medium">Mark Machine as Inactive</div>
                                <div className="text-xs text-muted-foreground">
                                    Mark the machine as inactive and stop operations
                                </div>
                            </div>
                        </Button>

                        {/* Separator */}
                        <div className="flex items-center gap-2">
                            <Separator className="flex-1" />
                            <span className="text-xs text-muted-foreground px-2">OR KEEP RUNNING WITH</span>
                            <Separator className="flex-1" />
                        </div>

                        {/* Keep Running Options */}
                        <Button
                            variant={unstableType === 'defective' ? 'default' : 'outline'}
                            className="w-full justify-start text-left h-auto p-4"
                            onClick={() => handleUnstableTypeSelection('defective')}
                        >
                            <div>
                                <div className="font-medium">Use Defective Parts</div>
                                <div className="text-xs text-muted-foreground">
                                    Increase defective parts quantity and reduce machine parts quantity
                                </div>
                            </div>
                        </Button>

                        <Button
                            variant={unstableType === 'less' ? 'default' : 'outline'}
                            className="w-full justify-start text-left h-auto p-4"
                            onClick={() => handleUnstableTypeSelection('less')}
                        >
                            <div>
                                <div className="font-medium">Use Fewer Parts</div>
                                <div className="text-xs text-muted-foreground">
                                    Decrease machine parts and increase damaged parts
                                </div>
                            </div>
                        </Button>
                    </div>


                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MachineUnstabilityForm;