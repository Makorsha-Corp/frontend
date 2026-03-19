import { Order, OrderedPart } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Separator } from "../../ui/separator"
import { Badge } from "../../ui/badge"
import { useEffect, useState } from "react"
import { fetchOrderedPartsByOrderID } from "@/services/OrderedPartsService"
import { Loader2, Cog, CheckCircle, XCircle } from "lucide-react"

interface OrderMachineInfoProps {
    order: Order
    mode: 'view' | 'manage' | 'default'
}

const OrderMachineInfo: React.FC<OrderMachineInfoProps> = ({ order, mode }) => {
    const [orderedParts, setOrderedParts] = useState<OrderedPart[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadOrderedParts = async () => {
            try {
                setLoading(true)
                const parts = await fetchOrderedPartsByOrderID(order.id)
                setOrderedParts(parts || [])
            } catch (error) {
                console.error("Failed to fetch ordered parts:", error)
            } finally {
                setLoading(false)
            }
        }

        loadOrderedParts()
    }, [order.id])



    const getMachineStatusIcon = () => {
        // Check if any ordered part has INACTIVE unstable_type
        const hasInactiveParts = orderedParts.some(part => part.unstable_type === 'INACTIVE');
        
        if (hasInactiveParts) {
            return <XCircle className="h-4 w-4 text-red-500" />
        }
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }

    const getMachineStatusBadge = () => {
        // Check if any ordered part has INACTIVE unstable_type
        const hasInactiveParts = orderedParts.some(part => part.unstable_type === 'INACTIVE');
        
        if (hasInactiveParts) {
            return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Will be Inactive</Badge>
        }
        
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Will remain Active</Badge>
    }



    return (
        <Card className="sm:col-span-1 h-full flex flex-col w-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                    <Cog className="h-5 w-5" />
                    {mode === "view" ? "Machine Info" : mode === "manage" ? "Machine Status" : "Machine Details"}
                </CardTitle>
            </CardHeader>
            <Separator className="my-4" />
            <CardContent className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                    </div>
                ) : (
                    <ul className="grid gap-3">
                        {/* Machine Information */}
                        <li className="flex items-center justify-between">
                            <span className="font-semibold text-muted-foreground">Machine</span>
                            <span className="text-right text-sm">
                                {order.factories?.abbreviation} - {order.factory_sections?.name} - {order.machines?.name}
                            </span>
                        </li>

                        {/* Machine Status */}
                        <li className="flex items-center justify-between">
                            <span className="font-semibold text-muted-foreground flex items-center gap-2">
                                {getMachineStatusIcon()}
                                Machine Status
                            </span>
                            {getMachineStatusBadge()}
                        </li>



                        {/* Source Factory for STM orders */}
                        {order.order_type === "STM" && order.src_factory && (
                            <li className="flex items-center justify-between">
                                <span className="font-semibold text-muted-foreground">Source Factory</span>
                                <span>{order.src_factory}</span>
                            </li>
                        )}

                        <Separator className="my-2" />

                        {/* Ordered Parts List */}
                        {orderedParts.length > 0 && (
                            <li className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-muted-foreground">Ordered Parts:</span>
                                    <span className="text-xs text-muted-foreground">{orderedParts.length} part(s)</span>
                                </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {orderedParts.map((part, index) => {
                                        // Get unstable type display
                                        const getUnstableTypeBadge = (unstableType: string | null) => {
                                            const status = unstableType || 'INACTIVE';
                                            const statusText = status === 'DEFECTIVE' ? 'Defective' : 
                                                              status === 'LESS' ? 'Less' : 
                                                              status === 'INACTIVE' ? 'Inactive' : 'Inactive';
                                            const colorClass = status === 'DEFECTIVE' ? 'bg-red-100 text-red-600' :
                                                              status === 'LESS' ? 'bg-yellow-100 text-yellow-600' :
                                                              status === 'INACTIVE' ? 'bg-orange-100 text-orange-600' :
                                                              'bg-orange-100 text-orange-600';
                                            
                                            return (
                                                <Badge variant="outline" className={`text-xs px-1 py-0 ${colorClass}`}>
                                                    {statusText}
                                                </Badge>
                                            );
                                        };
                                      
                                        return (
                                          <div
                                            key={index}
                                            className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded gap-2"
                                          >
                                            <div className="flex items-center gap-2 flex-1">
                                                <span className="font-medium">{part.parts.name}</span>
                                                {getUnstableTypeBadge(part.unstable_type)}
                                            </div>
                                            
                                            <span className="text-muted-foreground flex-shrink-0">
                                                {part.qty} {part.parts.unit}
                                            </span>
                                          </div>
                                        );
                                      })}
                                </div>
                            </li>
                        )}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
}

export default OrderMachineInfo
