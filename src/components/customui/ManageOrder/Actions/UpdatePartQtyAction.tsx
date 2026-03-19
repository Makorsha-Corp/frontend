import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateOrderedPartQtyByID } from '@/services/OrderedPartsService'
import { OrderedPart } from '@/types'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import React, { useState } from 'react'

interface UpdatePartQtyActionProps {
  openThisActionDialog: boolean
  setOpenThisActionDialog: (v: boolean) => void
  setActionMenuOpen: (v: boolean) => void
  orderedPartInfo: OrderedPart
}

const UpdatePartQtyAction: React.FC<UpdatePartQtyActionProps> = ({
  openThisActionDialog,
  setOpenThisActionDialog,
  setActionMenuOpen,
  orderedPartInfo,
}) => {
  const [newQuantity, setNewQuantity] = useState('')

  const handleUpdatePartQty = async () => {
    if (newQuantity === '') {
      toast.error('Please enter a valid number')
      return
    }

    const qty = Number(newQuantity)
    try {
      if (qty === orderedPartInfo.qty) {
        toast.error('Quantity is the same as current')
      } else if (qty < 0) {
        toast.error('Negative number is not allowed')
      } else if (qty === 0) {
        toast.error('Zero is not a valid input')
      } else {
        await updateOrderedPartQtyByID(orderedPartInfo.id, qty)
        toast.success('Quantity updated successfully')
        setOpenThisActionDialog(false)
        setActionMenuOpen(false)
      }
    } catch {
      toast.error('Failed to update quantity')
    } finally {
      setNewQuantity('')
    }
  }

  return (
    <Dialog open={openThisActionDialog} onOpenChange={setOpenThisActionDialog}>
      <DialogContent>
        <DialogTitle>Update Quantity</DialogTitle>
        <DialogDescription>
          <p className="text-sm text-muted-foreground">
            Current Quantity ({orderedPartInfo.qty}) will be updated.
          </p>
          <div className="grid gap-3 pt-2">
            <Label htmlFor="new_quantity">Quantity</Label>
            <Input
              id="new_quantity"
              type="number"
              placeholder="Enter the new quantity"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
            />
          </div>
        </DialogDescription>

        <Button onClick={handleUpdatePartQty}>Confirm</Button>
      </DialogContent>
    </Dialog>
  )
}

export default UpdatePartQtyAction
