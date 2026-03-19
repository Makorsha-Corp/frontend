import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { Button } from '../ui/button'
import { LucideGlasses } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { showExpenseLensPart } from '@/services/ButtonVisibilityHelper'

interface PartInfoProp {
    id: number,
    created_at: string,
    name: string,
    unit: string,
    description: string,
}

const PartInfo: React.FC<PartInfoProp> = ({id, created_at, name, unit, description}) => {
    
    const profile = useAuth().profile;
    const navigate = useNavigate();


    return (

        <Card className="sm:col-span-2" x-chunk="dashboard-05-chunk-0">
            <CardHeader className="pb-3">
                {/* old expense lens code here needs to be replaces with business lens url */}
                {/* <div className='flex justify-between'>
                    <CardTitle>Part Detail</CardTitle>
                    {profile && showExpenseLensPart(profile.permission) && 
                        <Button className='bg-cyan-600' onClick={()=>navigate(`/expenselens/${id}`)}>
                            ExpenseLens<LucideGlasses className='pl-2'></LucideGlasses>
                        </Button>
                    }

                </div> */}
            </CardHeader>
            <Separator className="my-4" />
            <CardContent>
                <ul className="grid gap-3">
                    <li className="flex items-center justify-between">
                        <span className="font-semibold text-muted-foreground">ID</span>
                        <span>{id}</span>
                    </li>
                    <li className="flex items-center justify-between">
                        <span className="font-semibold text-muted-foreground">Created at</span>
                        <span>{created_at}</span>
                    </li>
                    <li className="flex items-center justify-between">
                        <span className="font-semibold text-muted-foreground">Part Name</span>
                        <span>{name}</span>
                    </li>
                    <li className="flex items-center justify-between">
                        <span className="font-semibold text-muted-foreground">Unit</span>
                        <span>{unit}</span>
                    </li>
                </ul>
                <Separator className="my-2" />
                <span className="font-semibold text-muted-foreground">Description</span>
                <div className="max-w-xl text-balance leading-relaxed mt-2">{description}</div>
            </CardContent>
        </Card>
    )
}

export default PartInfo