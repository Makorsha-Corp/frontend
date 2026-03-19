import { Order } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Separator } from "../../ui/separator"
import { convertUtcToBDTime } from "@/services/helper"
import { useEffect, useState } from "react"
import { fetchProjectById } from "@/services/ProjectsService"
import { fetchProjectComponentById } from "@/services/ProjectComponentService"
import { fetchFactoryNameAndAbbreviation } from "@/services/FactoriesService"

interface OrderInfoProp {
    order: Order
    mode: 'view' | 'manage' | 'default'
    
}


const OrderInfo: React.FC<OrderInfoProp> = ({order,mode}) => {
  const [project, setProject] = useState<any>(null);
  const [projectComponent, setProjectComponent] = useState<any>(null);
  const [sourceFactoryName, setSourceFactoryName] = useState<string>('');


  return (
        <Card
        className="sm:col-span-2 h-full flex flex-col w-full" x-chunk="dashboard-05-chunk-0"
    >
        <CardHeader className="pb-3">
            <CardTitle> {mode==="view"? "View ": mode==="manage"? "Manage ": "" } Order: ID {order.id} </CardTitle>
        </CardHeader>
        <Separator className="my-4" />
        <CardContent className="flex-1">
            <ul className="grid gap-3">
            <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Factory</span>
                <span>{order.factories?.name}</span>
            </li>
            <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Order Type</span>
                <span>{order.order_type}</span>
            </li>
            <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Requisition Number</span>
                <span>{order.req_num??'-'}</span>
            </li>
            <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Created at</span>
                <span>{convertUtcToBDTime(order.created_at)}</span>
            </li>
            <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Created by</span>
                <span>{order.profiles.name}</span>
            </li>
            <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Department</span>
                <span>{order.departments.name}</span>
            </li>
            
            <li className="flex items-center justify-between">
                <span className="font-semibold text-muted-foreground">Current Status</span>
                <span>{order.statuses.name}</span>
            </li>
            
            </ul>
        <Separator className="my-2" />
        <span className="font-semibold text-muted-foreground">Note</span>
        <div className="text-balance leading-relaxed mt-2">{order.order_note}</div>
        </CardContent>
    </Card>
  )
}

export default OrderInfo