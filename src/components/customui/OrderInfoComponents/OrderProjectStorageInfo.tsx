import { Order, OrderedPart } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Separator } from "../../ui/separator"
import { useEffect, useState } from "react"
import { fetchProjectById } from "@/services/ProjectsService"
import { fetchProjectComponentById } from "@/services/ProjectComponentService"
import { fetchOrderedPartsByOrderID } from "@/services/OrderedPartsService"
import { fetchFactoryNameAndAbbreviation } from "@/services/FactoriesService"
import { Loader2, Warehouse } from "lucide-react"

interface OrderProjectStorageInfoProps {
    order: Order
    mode: 'view' | 'manage' | 'default'
}

const OrderProjectStorageInfo: React.FC<OrderProjectStorageInfoProps> = ({ order, mode }) => {
    const [project, setProject] = useState<any>(null)
    const [projectComponent, setProjectComponent] = useState<any>(null)
    const [orderedParts, setOrderedParts] = useState<OrderedPart[]>([])
    const [sourceFactoryName, setSourceFactoryName] = useState<string>('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadProjectData = async () => {
            try {
                setLoading(true)
                
                // Fetch project data
                if (order.project_id) {
                    const projectData = await fetchProjectById(order.project_id)
                    setProject(projectData)
                }
                
                // Fetch project component data
                if (order.project_component_id) {
                    const componentData = await fetchProjectComponentById(order.project_component_id)
                    setProjectComponent(componentData)
                }
                
                // Fetch source factory name
                if (order.src_factory) {
                    const factoryData = await fetchFactoryNameAndAbbreviation(order.src_factory)
                    setSourceFactoryName(factoryData || '')
                }
                
                // Fetch ordered parts
                const parts = await fetchOrderedPartsByOrderID(order.id)
                setOrderedParts(parts || [])
                
            } catch (error) {
                console.error("Failed to fetch project storage data:", error)
            } finally {
                setLoading(false)
            }
        }

        loadProjectData()
    }, [order.id, order.project_id, order.project_component_id, order.src_factory])

    return (
        <Card className="sm:col-span-1 h-full flex flex-col w-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                    <Warehouse className="h-5 w-5" />
                    Project Storage Info
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
                        {/* Project Information */}
                        <li className="flex items-center justify-between">
                            <span className="font-semibold text-muted-foreground">Project</span>
                            <span className="text-right text-sm">
                                {project?.name || 'N/A'}
                            </span>
                        </li>

                        {/* Component Information */}
                        <li className="flex items-center justify-between">
                            <span className="font-semibold text-muted-foreground">Component</span>
                            <span className="text-right text-sm">
                                {projectComponent?.name || 'N/A'}
                            </span>
                        </li>

                        {/* Source Factory Information */}
                        <li className="flex items-center justify-between">
                            <span className="font-semibold text-muted-foreground">Source Factory</span>
                            <span className="text-right text-sm">
                                {sourceFactoryName || 'N/A'}
                            </span>
                        </li>

                        <Separator className="my-2" />

                        {/* Ordered Parts List */}
                        {orderedParts.length > 0 && (
                            <li className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-muted-foreground">Ordered Parts:</span>
                                    <span className="text-xs text-muted-foreground">{orderedParts.length} part(s)</span>
                                </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {orderedParts.map((part, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded gap-2"
                                        >
                                            <div className="flex items-center gap-2 flex-1">
                                                <span className="font-medium">{part.parts.name}</span>
                                            </div>
                                            
                                            <span className="text-muted-foreground flex-shrink-0">
                                                {part.qty} {part.parts.unit}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </li>
                        )}

                        {orderedParts.length === 0 && (
                            <li className="text-center text-sm text-muted-foreground py-4">
                                No ordered parts found
                            </li>
                        )}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
}

export default OrderProjectStorageInfo
