import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { editPart, fetchPartByID } from '@/services/PartsService';
import { Part } from '@/types';
import { CirclePlus, Loader2, Pencil } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import PartInfo from '../PartInfo';

interface EditPartPopupProp {
    part_id: number,
    onSuccess?: (editedPart: Part) => void;
}

const EditPartPopup: React.FC<EditPartPopupProp> = ({part_id, onSuccess}) => {
    
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setisSubmitting] = useState(false);
    const [currentPart, setCurrentPart] =  useState<Part|null>(null)
    const [name, setName] = useState('');
    const [unit, setUnit] = useState('');
    const [description, setDescription] = useState('');


    useEffect(()=>{
        const loadPart = async () => {

            try {
                const data = await fetchPartByID(part_id);
                const currPart = data
                setCurrentPart(currPart)
                setName(currPart.name)
                setUnit(currPart.unit)
                setDescription(currPart.description)

            } catch (error) {
                console.log(error)
                toast.error('Failed to fetch part');
            } finally {
                setLoading(false)
            }
        };
        loadPart();
    }, [])
    
    const handleEditPart = async () => {
        setisSubmitting(true);
        try {
            // Use state directly instead of fetching values from the DOM
            const response = await editPart(part_id, name, unit, description);
            
            if (response) {
                toast.success("Part Updated");
    
                // Update the local currentPart state to the new values (optional)
                setCurrentPart({
                    ...currentPart!,
                    name: name,
                    unit: unit,
                    description: description
                });
    
                // Trigger onSuccess callback if provided
                if (onSuccess) {
                    onSuccess(response);
                }
            }
        } catch (error) {
            toast.error("" + error);
        } finally {
            setisSubmitting(false);
        }
    };
    
  
    return (
        <div className="p-4 rounded-lg">
            <div className="mb-4">
                <h2 className="text-2xl font-semibold">Edit Part</h2>
                <p className="text-gray-600">Modify the information for this part.</p>
            </div>
            <div className="grid gap-6">
                <div className="grid gap-3">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    type="text"
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                />
                </div>
                <div className="grid gap-3">
                <Label htmlFor="unit">Unit</Label>
                <Input
                    id="unit"
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                />
                </div>
                <div className="grid gap-3">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-32"
                />
                </div>
            </div>
            <div className="flex gap-4 py-5">
                {isSubmitting ? (
                <div className="ml-auto flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Updating Part...
                </div>
                ) : (
                <Button size="sm" className="ml-auto gap-2" onClick={handleEditPart}>
                    <Pencil className="h-4 w-4" />
                    Edit Part
                </Button>
                )}
            </div>
            </div>
  )
}

export default EditPartPopup