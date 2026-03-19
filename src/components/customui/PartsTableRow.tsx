import React, { useState } from 'react';
import { MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { TableCell, TableRow } from "../ui/table";
import { Link } from 'react-router-dom';
import { Dialog, DialogContent } from '../ui/dialog';
import EditPartPopup from './Parts/EditPartPopup';
import { DialogTitle } from '@radix-ui/react-dialog';
import toast from 'react-hot-toast';

interface PartsTableRowProps {
  id: number;
  name: string;
  unit: string;
  created_at: string;
  onRefresh: () => void;
}


const PartsTableRow: React.FC<PartsTableRowProps> = ({ id, name, unit, created_at,onRefresh }) => {
  
  const [isEditPartPopupOpen, setIsEditPartPopupOpen] = useState(false);
  // const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleEditPart = () => {
    setIsEditPartPopupOpen(true)
  }

  const handleEditSuccess = () => {
    setIsEditPartPopupOpen(false);
    onRefresh()
  };

  // const handleDeletePart = () => {
  //   toast.success("CLICKED DELETE")
  //   delete logic goes here
  // }
  return (
    <>
      <TableRow>
        <TableCell className="font-medium">
          <Link 
            to={`/viewpart/${id}`}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {id}
          </Link>
        </TableCell>
        <TableCell>
          {name}
        </TableCell>
        <TableCell>
          {unit}
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {created_at}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-haspopup="true"
                size="icon"
                variant="ghost"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <Link to={`/viewpart/${id}`}>
                <DropdownMenuItem>
                  View
                </DropdownMenuItem>
              </Link>
                <DropdownMenuItem onClick={handleEditPart}>
                  Edit
                </DropdownMenuItem>
                {/* <DropdownMenuItem className="text-red-600" onClick={()=>setIsDeleteDialogOpen(true)}>
                  Delete
                </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      <Dialog open={isEditPartPopupOpen} onOpenChange={setIsEditPartPopupOpen}>
          <DialogContent>
              <EditPartPopup 
                part_id={id} 
                onSuccess={handleEditSuccess}               
              />
          </DialogContent>
      </Dialog>
      {/* <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
                <DialogTitle className="text-red-600">Delete part -  <span>{id}</span></DialogTitle>
                <div>
                  Are you sure you want to delete this order?
                </div>
                <Button onClick={handleDeletePart}>Confirm</Button>
        </DialogContent>
      </Dialog> */}
    </>
    
  );
};

export default PartsTableRow;
